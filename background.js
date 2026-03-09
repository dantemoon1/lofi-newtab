// Fix for YouTube Error 153 in Chrome extensions
// Source: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/OUJad0q-d_g
//
// Chrome doesn't send the Referer header for iframes in extension pages,
// but YouTube now requires this header. This rule adds it for YouTube embeds.

const iframeHosts = [
  'www.youtube.com',
];

const POMODORO_STATE_KEY = 'pomodoroState';
const POMODORO_ALARM_NAME = 'pomodoro-session-end';
const POMODORO_NOTIFICATION_ID = 'pomodoro-status';

function getDefaultPomodoroState() {
  return {
    status: 'idle',
    mode: 'work',
    endTime: null,
    remainingSeconds: 25 * 60,
    sessionsCompleted: 0,
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    transitionAt: null,
    transitionTitle: '',
    transitionBody: '',
  };
}

function getModeDurationSeconds(state, mode = state.mode) {
  if (mode === 'break') {
    return state.breakDuration * 60;
  }

  if (mode === 'longBreak') {
    return state.longBreakDuration * 60;
  }

  return state.workDuration * 60;
}

function normalizePomodoroState(rawState = {}) {
  const defaults = getDefaultPomodoroState();
  const workDuration = Number.parseInt(rawState.workDuration, 10);
  const breakDuration = Number.parseInt(rawState.breakDuration, 10);
  const longBreakDuration = Number.parseInt(rawState.longBreakDuration, 10);
  const mode = rawState.mode === 'break' || rawState.mode === 'longBreak' ? rawState.mode : 'work';
  const status = rawState.status === 'running' || rawState.status === 'paused' ? rawState.status : 'idle';
  const remainingSeconds = Number.parseInt(rawState.remainingSeconds, 10);
  const normalized = {
    ...defaults,
    ...rawState,
    mode,
    status,
    endTime: typeof rawState.endTime === 'number' ? rawState.endTime : null,
    workDuration: Number.isFinite(workDuration) && workDuration > 0 ? workDuration : defaults.workDuration,
    breakDuration: Number.isFinite(breakDuration) && breakDuration > 0 ? breakDuration : defaults.breakDuration,
    longBreakDuration: Number.isFinite(longBreakDuration) && longBreakDuration > 0 ? longBreakDuration : defaults.longBreakDuration,
    sessionsCompleted: Number.isFinite(rawState.sessionsCompleted) && rawState.sessionsCompleted >= 0
      ? Math.min(rawState.sessionsCompleted, 3)
      : defaults.sessionsCompleted,
    transitionAt: typeof rawState.transitionAt === 'number' ? rawState.transitionAt : null,
    transitionTitle: typeof rawState.transitionTitle === 'string' ? rawState.transitionTitle : '',
    transitionBody: typeof rawState.transitionBody === 'string' ? rawState.transitionBody : '',
  };

  normalized.remainingSeconds = Number.isFinite(remainingSeconds) && remainingSeconds >= 0
    ? remainingSeconds
    : getModeDurationSeconds(normalized, mode);

  if (normalized.status !== 'running') {
    normalized.endTime = null;
  }

  return normalized;
}

function getNextPomodoroState(state) {
  const transitionAt = Date.now();

  if (state.mode === 'work') {
    const completedSessions = state.sessionsCompleted + 1;

    if (completedSessions >= 4) {
      return normalizePomodoroState({
        ...state,
        status: 'idle',
        mode: 'longBreak',
        endTime: null,
        remainingSeconds: state.longBreakDuration * 60,
        sessionsCompleted: 0,
        transitionAt,
        transitionTitle: 'Work session complete',
        transitionBody: `Time for a long break (${state.longBreakDuration} minutes)`,
      });
    }

    return normalizePomodoroState({
      ...state,
      status: 'idle',
      mode: 'break',
      endTime: null,
      remainingSeconds: state.breakDuration * 60,
      sessionsCompleted: completedSessions,
      transitionAt,
      transitionTitle: 'Work session complete',
      transitionBody: `Time for a break (${state.breakDuration} minutes)`,
    });
  }

  return normalizePomodoroState({
    ...state,
    status: 'idle',
    mode: 'work',
    endTime: null,
    remainingSeconds: state.workDuration * 60,
    transitionAt,
    transitionTitle: 'Break complete',
    transitionBody: `Ready to work? (${state.workDuration} minutes)`,
  });
}

function showPomodoroNotification(state) {
  if (!state.transitionTitle || !state.transitionBody) {
    return;
  }

  chrome.notifications.create(POMODORO_NOTIFICATION_ID, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: state.transitionTitle,
    message: state.transitionBody,
    priority: 2,
  });
}

async function syncPomodoroAlarm(state) {
  await chrome.alarms.clear(POMODORO_ALARM_NAME);

  if (state.status === 'running' && state.endTime) {
    chrome.alarms.create(POMODORO_ALARM_NAME, { when: state.endTime });
  }
}

async function writePomodoroState(nextState) {
  const normalized = normalizePomodoroState(nextState);
  await chrome.storage.local.set({ [POMODORO_STATE_KEY]: normalized });
  await syncPomodoroAlarm(normalized);
  return normalized;
}

async function readPomodoroState() {
  const result = await chrome.storage.local.get(POMODORO_STATE_KEY);
  let state = normalizePomodoroState(result[POMODORO_STATE_KEY]);

  if (state.status === 'running' && state.endTime && state.endTime <= Date.now()) {
    state = await writePomodoroState(getNextPomodoroState(state));
    showPomodoroNotification(state);
  } else {
    await syncPomodoroAlarm(state);
  }

  return state;
}

function sendAsyncResponse(handler, sendResponse) {
  handler()
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error('Background message handler failed:', error);
      sendResponse({ error: error.message || 'Unknown error' });
    });
}

chrome.runtime.onInstalled.addListener((details) => {
  const RULE = {
    id: 1,
    condition: {
      initiatorDomains: [chrome.runtime.id],
      requestDomains: iframeHosts,
      resourceTypes: ['sub_frame'],
    },
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        { header: 'referer', value: chrome.runtime.id, operation: 'set' },
      ],
    },
  };

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE.id],
    addRules: [RULE],
  });

  if (details.reason === 'update') {
    chrome.storage.local.set({ showChangelog: true });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'pomodoro:getState') {
    sendAsyncResponse(async () => ({ state: await readPomodoroState() }), sendResponse);
    return true;
  }

  if (message?.type === 'pomodoro:setState') {
    sendAsyncResponse(async () => ({ state: await writePomodoroState(message.state) }), sendResponse);
    return true;
  }

  return false;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== POMODORO_ALARM_NAME) {
    return;
  }

  await readPomodoroState();
});

readPomodoroState().catch((error) => {
  console.error('Failed to initialize pomodoro state:', error);
});
