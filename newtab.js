let use24Hour = true;

// Video overlay interaction
const videoOverlay = document.getElementById('videoOverlay');
const videoHint = document.getElementById('videoHint');
let overlayRemoved = false;
let interactionTimeout = null;
const OVERLAY_TIMEOUT = 10000; // 10 seconds
let overrideTimeValue = null;

videoOverlay.addEventListener('click', () => {
  if (!overlayRemoved) {
    // First click - remove overlay and hide hint
    videoOverlay.style.pointerEvents = 'none';
    videoHint.style.display = 'none';
    overlayRemoved = true;

    // Reset after a short period of inactivity
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      videoOverlay.style.pointerEvents = 'auto';
      videoHint.style.display = 'block';
      overlayRemoved = false;
    }, OVERLAY_TIMEOUT);
  }
});

// Reset timer on any interaction with the page
document.addEventListener('click', (e) => {
  if (overlayRemoved && e.target !== videoOverlay) {
    // User is actively interacting, extend timer
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      videoOverlay.style.pointerEvents = 'auto';
      videoHint.style.display = 'block';
      overlayRemoved = false;
    }, OVERLAY_TIMEOUT);
  }
});

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const timeElement = document.getElementById('time');

  if (overrideTimeValue) {
    timeElement.textContent = overrideTimeValue;
  } else {
    if (!use24Hour) {
      const period = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeElement.textContent = `${h}:${m} ${period}`;
    } else {
      h = h.toString().padStart(2, '0');
      timeElement.textContent = `${h}:${m}`;
    }
  }

  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  document.getElementById('date').textContent = now.toLocaleDateString(undefined, options);
}
setInterval(updateClock, 1000 * 10);
updateClock();

const iframe = document.getElementById('yt');
const muteToggle = document.getElementById('muteToggle');
const fullscreenBtn = document.getElementById('fullscreenBtn');
let isMuted = true;

const YT_ORIGIN = 'https://www.youtube.com';

muteToggle.addEventListener('click', () => {
  try {
    if (isMuted) {
      // Unmute
      iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', YT_ORIGIN);
      muteToggle.textContent = '🔊 Mute';
      muteToggle.title = 'Click to mute';
    } else {
      // Mute
      iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', YT_ORIGIN);
      muteToggle.textContent = '🔇 Unmute';
      muteToggle.title = 'Click to unmute';
    }
    isMuted = !isMuted;
  } catch (e) {
    console.error('Error toggling mute:', e);
  }
});

const settingsBtn = document.getElementById('settingsBtn');
const controls = document.getElementById('controls');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const saveSettings = document.getElementById('saveSettings');
const streamUrlInput = document.getElementById('streamUrl');
const use24hCheckbox = document.getElementById('use24h');
const weatherCityInput = document.getElementById('weatherCityInput');
const weatherCityRow = document.getElementById('weatherCityRow');
const weatherModeInputs = document.querySelectorAll('input[name="weatherMode"]');
const useFahrenheitCheckbox = document.getElementById('useFahrenheit');
const showWeatherCheckbox = document.getElementById('showWeather');
const clockPositionInput = document.getElementById('clockPosition');
const infoPositionInput = document.getElementById('infoPosition');
const overrideTimeInput = document.getElementById('overrideTime');
const veilOpacityInput = document.getElementById('veilOpacity');
const veilOpacityValue = document.getElementById('veilOpacityValue');
const veilSwatches = document.querySelectorAll('.veil-swatch');
const veilElement = document.getElementById('veil');
const resetVeilBtn = document.getElementById('resetVeil');
const pomodoroWorkInput = document.getElementById('pomodoroWork');
const pomodoroBreakInput = document.getElementById('pomodoroBreak');
const pomodoroLongBreakInput = document.getElementById('pomodoroLongBreak');
const pomodoroPulseSpeedInput = document.getElementById('pomodoroPulseSpeed');
const showPomodoroCheckbox = document.getElementById('showPomodoro');
const apiKeyInput = document.getElementById('apiKey');
const videoSearchInput = document.getElementById('videoSearch');
const searchBtn = document.getElementById('searchBtn');
const videoResults = document.getElementById('videoResults');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const editApiKeyBtn = document.getElementById('editApiKey');
const apiKeyInputContainer = document.getElementById('apiKeyInput');
const apiKeyConfiguredContainer = document.getElementById('apiKeyConfigured');

const DEFAULT_VIDEO_ID = 'jfKfPfyJRdk';

const STORAGE_KEYS = {
  youtubeApiKey: 'youtubeApiKey'
};

const POMODORO_STATE_KEY = 'pomodoroState';

function hasChromeStorageSync() {
  return typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.sync);
}

function getStoredApiKey() {
  if (!hasChromeStorageSync()) {
    return Promise.resolve(localStorage.getItem(STORAGE_KEYS.youtubeApiKey));
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEYS.youtubeApiKey, (result) => {
      if (chrome.runtime?.lastError) {
        console.error('Error reading API key from chrome.storage:', chrome.runtime.lastError);
        resolve(null);
        return;
      }
      resolve(result[STORAGE_KEYS.youtubeApiKey] || null);
    });
  });
}

function setStoredApiKey(value) {
  if (!hasChromeStorageSync()) {
    localStorage.setItem(STORAGE_KEYS.youtubeApiKey, value);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEYS.youtubeApiKey]: value }, () => {
      if (chrome.runtime?.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to save API key'));
      } else {
        resolve();
      }
    });
  });
}

async function migrateLegacyApiKey() {
  if (!hasChromeStorageSync()) {
    return;
  }

  const legacyKey = localStorage.getItem(STORAGE_KEYS.youtubeApiKey);
  if (!legacyKey) {
    return;
  }

  try {
    await setStoredApiKey(legacyKey);
    localStorage.removeItem(STORAGE_KEYS.youtubeApiKey);
  } catch (error) {
    console.error('Failed to migrate legacy API key:', error);
  }
}

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

function getPomodoroModeDurationSeconds(state, mode = state.mode) {
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
  const mode = rawState.mode === 'break' || rawState.mode === 'longBreak' ? rawState.mode : 'work';
  const status = rawState.status === 'running' || rawState.status === 'paused' ? rawState.status : 'idle';
  const workDuration = Number.parseInt(rawState.workDuration, 10);
  const breakDuration = Number.parseInt(rawState.breakDuration, 10);
  const longBreakDuration = Number.parseInt(rawState.longBreakDuration, 10);
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
    : getPomodoroModeDurationSeconds(normalized, mode);

  if (normalized.status !== 'running') {
    normalized.endTime = null;
  }

  return normalized;
}

function hasChromePomodoroMessaging() {
  return typeof chrome !== 'undefined' && !!(chrome.runtime?.sendMessage && chrome.storage?.onChanged);
}

async function getSharedPomodoroState() {
  if (!hasChromePomodoroMessaging()) {
    return normalizePomodoroState(JSON.parse(localStorage.getItem(POMODORO_STATE_KEY) || 'null') || {});
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'pomodoro:getState' }, (response) => {
      if (chrome.runtime?.lastError || response?.error) {
        console.error('Error loading Pomodoro state:', chrome.runtime?.lastError || response?.error);
        resolve(getDefaultPomodoroState());
        return;
      }

      resolve(normalizePomodoroState(response?.state));
    });
  });
}

async function setSharedPomodoroState(nextState) {
  const normalized = normalizePomodoroState(nextState);

  if (!hasChromePomodoroMessaging()) {
    localStorage.setItem(POMODORO_STATE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'pomodoro:setState', state: normalized }, (response) => {
      if (chrome.runtime?.lastError || response?.error) {
        reject(new Error(chrome.runtime?.lastError?.message || response?.error || 'Failed to save Pomodoro state'));
        return;
      }

      resolve(normalizePomodoroState(response?.state));
    });
  });
}

// Veil color presets
const VEIL_COLORS = {
  gray: { r: 120, g: 120, b: 120 },
  warm: { r: 180, g: 140, b: 100 },
  cool: { r: 100, g: 130, b: 160 },
  black: { r: 0, g: 0, b: 0 }
};

// Veil defaults
const DEFAULT_VEIL_COLOR = 'gray';
const DEFAULT_VEIL_OPACITY = 45;

// Veil management
let currentVeilColor = 'gray';
let currentVeilOpacity = 45;

function updateVeil(color, opacity) {
  const rgb = VEIL_COLORS[color];
  const alpha = opacity / 100;
  veilElement.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getSelectedWeatherMode() {
  const selected = Array.from(weatherModeInputs).find((input) => input.checked);
  return selected?.value === 'auto' ? 'auto' : 'manual';
}

function setSelectedWeatherMode(mode) {
  weatherModeInputs.forEach((input) => {
    input.checked = input.value === mode;
  });
}

function updateWeatherSettingsVisibility() {
  const isAuto = getSelectedWeatherMode() === 'auto';
  weatherCityRow.style.display = isAuto ? 'none' : 'block';
}

function extractYouTubeSource(url) {
  if (!url) return null;

  const trimmed = url.trim();

  if (!trimmed.includes('youtube.com') && !trimmed.includes('youtu.be')) {
    if (trimmed.length === 11) {
      return { type: 'video', videoId: trimmed };
    }

    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '');
    const listId = parsed.searchParams.get('list');
    const watchVideoId = parsed.searchParams.get('v');
    const index = parsed.searchParams.get('index');

    if (host === 'youtu.be') {
      const shortId = parsed.pathname.replace(/^\//, '').split('/')[0] || null;

      if (listId) {
        return {
          type: 'playlist',
          playlistId: listId,
          videoId: shortId,
          index
        };
      }

      return shortId ? { type: 'video', videoId: shortId } : null;
    }

    if (host.endsWith('youtube.com')) {
      if (listId) {
        let playlistVideoId = watchVideoId;
        const segments = parsed.pathname.split('/').filter(Boolean);
        const [first, second] = segments;

        if (!playlistVideoId && first === 'embed' && second && second !== 'videoseries') playlistVideoId = second;
        if (!playlistVideoId && first === 'live' && second) playlistVideoId = second;
        if (!playlistVideoId && first === 'shorts' && second) playlistVideoId = second;

        return {
          type: 'playlist',
          playlistId: listId,
          videoId: playlistVideoId || null,
          index
        };
      }

      if (watchVideoId) {
        return { type: 'video', videoId: watchVideoId };
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return null;

      const [first, second] = segments;
      if (first === 'embed' && second && second !== 'videoseries') return { type: 'video', videoId: second };
      if (first === 'live' && second) return { type: 'video', videoId: second };
      if (first === 'shorts' && second) return { type: 'video', videoId: second };
      if (first === 'playlist') return null;
    }
  } catch (error) {
    console.warn('Error parsing YouTube URL:', error);
  }

  const listMatch = trimmed.match(/[?&]list=([^&]+)/);
  if (listMatch) {
    const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
    const indexMatch = trimmed.match(/[?&]index=([^&]+)/);

    return {
      type: 'playlist',
      playlistId: listMatch[1],
      videoId: watchMatch ? watchMatch[1] : null,
      index: indexMatch ? indexMatch[1] : null
    };
  }

  const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (watchMatch) return { type: 'video', videoId: watchMatch[1] };

  const pathMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed|live|shorts)\/)([^?&]+)/);
  if (pathMatch) return { type: 'video', videoId: pathMatch[1] };

  return null;
}

function getYouTubeSourceKey(source) {
  if (!source) return '';

  if (source.type === 'playlist') {
    const indexPart = source.index ? `:${source.index}` : '';
    const videoPart = source.videoId ? `:${source.videoId}` : '';
    return `playlist:${source.playlistId}${videoPart}${indexPart}`;
  }

  return `video:${source.videoId}`;
}

function buildYouTubeEmbedSrc(source) {
  const baseParams = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    playsinline: '1',
    iv_load_policy: '3',
    enablejsapi: '1',
    loop: '1',
  });

  if (source.type === 'playlist') {
    baseParams.set('listType', 'playlist');
    baseParams.set('list', source.playlistId);
    if (source.index) {
      baseParams.set('index', source.index);
    }

    const embedPath = source.videoId ? source.videoId : 'videoseries';
    return `https://www.youtube.com/embed/${embedPath}?${baseParams.toString()}`;
  }

  baseParams.set('playlist', source.videoId);
  return `https://www.youtube.com/embed/${source.videoId}?${baseParams.toString()}`;
}

// Load saved video URL from localStorage
async function loadSettings() {
  await migrateLegacyApiKey();

  const savedUrl = localStorage.getItem('videoUrl') || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  streamUrlInput.value = savedUrl;
  const source = extractYouTubeSource(savedUrl);
  if (source) {
    updateIframeSrc(source, true);
  }

  // Load 24-hour clock preference
  use24Hour = localStorage.getItem('use24Hour') !== 'false';
  use24hCheckbox.checked = use24Hour;

  useFahrenheit = localStorage.getItem('useFahrenheit') === 'true';
  useFahrenheitCheckbox.checked = useFahrenheit;

  const weatherMode = localStorage.getItem('weatherMode') === 'manual' ? 'manual' : 'auto';
  setSelectedWeatherMode(weatherMode);
  updateWeatherSettingsVisibility();

  // Load show weather preference
  const showWeather = localStorage.getItem('showWeather') !== 'false'; // default true
  showWeatherCheckbox.checked = showWeather;
  document.getElementById('weather').style.display = showWeather ? 'block' : 'none';

  // Load weather settings
  const savedCity = localStorage.getItem('weatherCity');
  if (savedCity) {
    weatherCityInput.value = savedCity;
  }

  if (showWeather) {
    refreshWeather();
  } else {
    setWeatherPlaceholder();
  }
  startWeatherRefreshLoop();

  // Load position settings
  const clockPos = localStorage.getItem('clockPosition') || '10';
  const infoPos = localStorage.getItem('infoPosition') || '5';
  clockPositionInput.value = clockPos;
  infoPositionInput.value = infoPos;
  document.getElementById('clock').style.top = `${clockPos}%`;
  document.getElementById('info').style.bottom = `${infoPos}%`;

  // Load optional time override
  overrideTimeValue = localStorage.getItem('overrideTimeValue');
  overrideTimeInput.value = overrideTimeValue || '';

  // Load API key
  const savedApiKey = await getStoredApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    // Show configured state
    apiKeyInputContainer.style.display = 'none';
    apiKeyConfiguredContainer.style.display = 'flex';
  } else {
    apiKeyInputContainer.style.display = 'flex';
    apiKeyConfiguredContainer.style.display = 'none';
  }

  // Load Pomodoro settings
  const sharedPomodoroState = await getSharedPomodoroState();
  pomodoroWorkDuration = sharedPomodoroState.workDuration;
  pomodoroBreakDuration = sharedPomodoroState.breakDuration;
  pomodoroLongBreakDuration = sharedPomodoroState.longBreakDuration;
  pomodoroPulseSpeed = parseFloat(localStorage.getItem('pomodoroPulseSpeed') || '3');
  pomodoroWorkInput.value = pomodoroWorkDuration;
  pomodoroBreakInput.value = pomodoroBreakDuration;
  pomodoroLongBreakInput.value = pomodoroLongBreakDuration;
  pomodoroPulseSpeedInput.value = pomodoroPulseSpeed;

  // Apply pulse speed to CSS
  document.documentElement.style.setProperty('--pom-pulse-speed', `${pomodoroPulseSpeed}s`);

  // Load show Pomodoro preference
  const showPomodoro = localStorage.getItem('showPomodoro') !== 'false'; // default true
  showPomodoroCheckbox.checked = showPomodoro;
  document.getElementById('pomodoro').style.display = showPomodoro ? 'flex' : 'none';

  // Load veil settings
  currentVeilOpacity = parseInt(localStorage.getItem('veilOpacity') || '45');
  currentVeilColor = localStorage.getItem('veilColor') || 'gray';
  veilOpacityInput.value = currentVeilOpacity;
  veilOpacityValue.textContent = `${currentVeilOpacity}%`;

  // Set active swatch
  veilSwatches.forEach(s => s.classList.remove('active'));
  const activeSwatch = Array.from(veilSwatches).find(s => s.dataset.color === currentVeilColor);
  if (activeSwatch) activeSwatch.classList.add('active');

  // Apply veil
  updateVeil(currentVeilColor, currentVeilOpacity);

  setPomodoroState(sharedPomodoroState);
  updateClock();
}

// Update iframe src with a video or playlist source
function updateIframeSrc(source, videoChanged = false) {
  const newSrc = buildYouTubeEmbedSrc(source);

  // Only reload iframe if video actually changed
  if (videoChanged) {
    iframe.src = newSrc;
    // Reset mute state when changing video
    isMuted = true;
    muteToggle.textContent = '🔇 Unmute';
    muteToggle.title = 'Click to unmute';
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;

    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Add active class to clicked tab and corresponding content
    btn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  });
});

// Veil opacity slider
veilOpacityInput.addEventListener('input', (e) => {
  const opacity = parseInt(e.target.value);
  currentVeilOpacity = opacity;
  veilOpacityValue.textContent = `${opacity}%`;
});

// Veil color swatches
veilSwatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    // Remove active class from all swatches
    veilSwatches.forEach(s => s.classList.remove('active'));
    // Add active class to clicked swatch
    swatch.classList.add('active');

    currentVeilColor = swatch.dataset.color;
  });
});

weatherModeInputs.forEach((input) => {
  input.addEventListener('change', updateWeatherSettingsVisibility);
});

// Reset veil to default
resetVeilBtn.addEventListener('click', () => {
  // Reset to defaults
  currentVeilColor = DEFAULT_VEIL_COLOR;
  currentVeilOpacity = DEFAULT_VEIL_OPACITY;

  // Update slider and display
  veilOpacityInput.value = DEFAULT_VEIL_OPACITY;
  veilOpacityValue.textContent = `${DEFAULT_VEIL_OPACITY}%`;

  // Update active swatch
  veilSwatches.forEach(s => s.classList.remove('active'));
  const defaultSwatch = Array.from(veilSwatches).find(s => s.dataset.color === DEFAULT_VEIL_COLOR);
  if (defaultSwatch) defaultSwatch.classList.add('active');
});

// Open settings modal
settingsBtn.addEventListener('click', async () => {
  settingsModal.classList.add('show');

  // Load cached "lofi" results if available
  const apiKey = await getStoredApiKey();
  if (apiKey) {
    const cachedResults = getCachedSearch('lofi');
    if (cachedResults) {
      renderVideoCards(cachedResults);
    } else {
      // Show hint if no cache available
      videoResults.innerHTML = '<p class="browser-hint">Click Search to browse live videos</p>';
    }
  }
});

// Close settings modal
closeModal.addEventListener('click', () => {
  settingsModal.classList.remove('show');
});

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('show');
  }
});

// Save settings
saveSettings.addEventListener('click', async () => {
  const url = streamUrlInput.value.trim() || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  const source = extractYouTubeSource(url);

  if (!source) {
    alert('Invalid YouTube video or playlist URL. Please check and try again.');
    return;
  }

  // Check if video URL actually changed
  const oldUrl = localStorage.getItem('videoUrl') || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  const oldSource = extractYouTubeSource(oldUrl);
  const videoChanged = getYouTubeSourceKey(source) !== getYouTubeSourceKey(oldSource);

  localStorage.setItem('videoUrl', url);
  localStorage.setItem('use24Hour', use24hCheckbox.checked);
  use24Hour = use24hCheckbox.checked;

  // Save show weather preference
  const showWeather = showWeatherCheckbox.checked;
  localStorage.setItem('showWeather', showWeather);
  document.getElementById('weather').style.display = showWeather ? 'block' : 'none';

  // Save weather settings
  const weatherMode = getSelectedWeatherMode();
  localStorage.setItem('weatherMode', weatherMode);
  const city = weatherCityInput.value.trim();
  if (city) {
    localStorage.setItem('weatherCity', city);
  } else {
    localStorage.removeItem('weatherCity');
  }
  useFahrenheit = useFahrenheitCheckbox.checked;
  localStorage.setItem('useFahrenheit', useFahrenheit);

  if (showWeather) {
    await refreshWeather();
  } else {
    setWeatherPlaceholder();
  }
  startWeatherRefreshLoop();

  // Save position settings
  const clockPos = clockPositionInput.value || '10';
  const infoPos = infoPositionInput.value || '5';
  localStorage.setItem('clockPosition', clockPos);
  localStorage.setItem('infoPosition', infoPos);
  document.getElementById('clock').style.top = `${clockPos}%`;
  document.getElementById('info').style.bottom = `${infoPos}%`;

  const customTime = overrideTimeInput.value.trim();
  if (customTime) {
    overrideTimeValue = customTime;
    localStorage.setItem('overrideTimeValue', customTime);
  } else {
    overrideTimeValue = null;
    localStorage.removeItem('overrideTimeValue');
  }

  // Save show Pomodoro preference
  const showPomodoro = showPomodoroCheckbox.checked;
  localStorage.setItem('showPomodoro', showPomodoro);
  document.getElementById('pomodoro').style.display = showPomodoro ? 'flex' : 'none';

  // Save Pomodoro settings
  pomodoroWorkDuration = parseInt(pomodoroWorkInput.value || '25');
  pomodoroBreakDuration = parseInt(pomodoroBreakInput.value || '5');
  pomodoroLongBreakDuration = parseInt(pomodoroLongBreakInput.value || '15');
  pomodoroPulseSpeed = parseFloat(pomodoroPulseSpeedInput.value || '3');
  localStorage.setItem('pomodoroPulseSpeed', pomodoroPulseSpeed);

  // Apply pulse speed to CSS
  document.documentElement.style.setProperty('--pom-pulse-speed', `${pomodoroPulseSpeed}s`);

  try {
    const nextPomodoroState = await setSharedPomodoroState({
      ...pomodoroState,
      status: 'idle',
      mode: 'work',
      endTime: null,
      remainingSeconds: pomodoroWorkDuration * 60,
      sessionsCompleted: 0,
      workDuration: pomodoroWorkDuration,
      breakDuration: pomodoroBreakDuration,
      longBreakDuration: pomodoroLongBreakDuration,
      transitionAt: null,
      transitionTitle: '',
      transitionBody: '',
    });
    setPomodoroState(nextPomodoroState);
  } catch (error) {
    console.error('Failed to save Pomodoro settings:', error);
  }

  // Save veil settings
  localStorage.setItem('veilOpacity', currentVeilOpacity);
  localStorage.setItem('veilColor', currentVeilColor);
  updateVeil(currentVeilColor, currentVeilOpacity);

  // Note: API key is now saved separately via the Save button, not here

  updateIframeSrc(source, videoChanged);
  updateClock();
  settingsModal.classList.remove('show');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (settingsModal.classList.contains('show')) {
      settingsModal.classList.remove('show');
    } else {
      controls.classList.toggle('hidden');
    }
  }
});

// Weather functionality
let weatherData = null;
let useFahrenheit = false;
let weatherRefreshInterval = null;

const WEATHER_CACHE_KEY = 'weatherCache';
const WEATHER_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const WEATHER_LOCATION_CACHE_KEY = 'weatherLocationCache';
const WEATHER_LOCATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function setWeatherPlaceholder(tempText = 'Set location in settings', cityText = '') {
  weatherData = null;
  document.getElementById('weatherTemp').textContent = tempText;
  document.getElementById('weatherCity').textContent = cityText;
}

function getWeatherCache() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Failed to read weather cache:', error);
    return {};
  }
}

function saveWeatherCache(cache) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to write weather cache:', error);
  }
}

function getWeatherLocationCache() {
  try {
    const raw = localStorage.getItem(WEATHER_LOCATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to read weather location cache:', error);
    return null;
  }
}

function saveWeatherLocationCache(location) {
  try {
    localStorage.setItem(WEATHER_LOCATION_CACHE_KEY, JSON.stringify({
      ...location,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to write weather location cache:', error);
  }
}

function getCachedAutoLocation() {
  const cached = getWeatherLocationCache();
  if (!cached) return null;

  if (Date.now() - cached.timestamp > WEATHER_LOCATION_CACHE_TTL) {
    localStorage.removeItem(WEATHER_LOCATION_CACHE_KEY);
    return null;
  }

  return cached;
}

function makeWeatherCacheId(locationKey, fahrenheit) {
  return `${locationKey}|${fahrenheit ? 'F' : 'C'}`;
}

function getCachedWeather(locationKey) {
  if (!locationKey) return null;

  const cache = getWeatherCache();
  const cacheId = makeWeatherCacheId(locationKey, useFahrenheit);
  const entry = cache[cacheId];

  if (!entry) return null;

  if (Date.now() - entry.timestamp > WEATHER_CACHE_TTL) {
    // Expired cache entry – remove it
    delete cache[cacheId];
    saveWeatherCache(cache);
    return null;
  }

  return entry.data;
}

function setCachedWeather(locationKey, data) {
  if (!locationKey || !data) return;

  const cache = getWeatherCache();
  const cacheId = makeWeatherCacheId(locationKey, useFahrenheit);
  cache[cacheId] = {
    data,
    timestamp: Date.now()
  };
  saveWeatherCache(cache);
}

async function geocodeWeatherCity(city) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!response.ok) {
    throw new Error('Geocoding request failed');
  }

  const geoData = await response.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error('City not found');
  }

  const { latitude, longitude, name } = geoData.results[0];
  return { latitude, longitude, label: name };
}

async function getApproximateLocation() {
  const cached = getCachedAutoLocation();
  if (cached) {
    return cached;
  }

  const response = await fetch('https://ifconfig.co/json');
  if (!response.ok) {
    throw new Error('Approximate location request failed');
  }

  const data = await response.json();
  const latitude = Number.parseFloat(data.latitude);
  const longitude = Number.parseFloat(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Approximate location response missing coordinates');
  }

  const location = {
    latitude,
    longitude,
    label: data.city || data.region || 'Current location'
  };
  saveWeatherLocationCache(location);
  return location;
}

async function fetchWeatherForCoordinates(latitude, longitude, label, locationKey) {
  const cached = getCachedWeather(locationKey);
  if (cached) {
    weatherData = cached;
    updateWeatherDisplay();
    return;
  }

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=${useFahrenheit ? 'fahrenheit' : 'celsius'}`);
  if (!response.ok) {
    throw new Error('Weather request failed');
  }

  const weather = await response.json();
  if (!weather.current) {
    throw new Error('Weather response missing current data');
  }

  weatherData = {
    temp: Math.round(weather.current.temperature_2m),
    code: weather.current.weather_code,
    city: label
  };

  setCachedWeather(locationKey, weatherData);
  updateWeatherDisplay();
}

async function fetchWeatherByCity(city) {
  const resolved = await geocodeWeatherCity(city);
  const cacheKey = `city:${city.trim().toLowerCase()}`;
  await fetchWeatherForCoordinates(resolved.latitude, resolved.longitude, resolved.label, cacheKey);
}

async function fetchWeatherByAutoLocation() {
  const location = await getApproximateLocation();
  const cacheKey = `coords:${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
  await fetchWeatherForCoordinates(location.latitude, location.longitude, location.label, cacheKey);
}

async function refreshWeather() {
  if (!showWeatherCheckbox.checked) {
    return;
  }

  const weatherMode = getSelectedWeatherMode();
  const savedCity = weatherCityInput.value.trim() || localStorage.getItem('weatherCity')?.trim() || '';

  try {
    if (weatherMode === 'auto') {
      await fetchWeatherByAutoLocation();
      return;
    }

    if (!savedCity) {
      setWeatherPlaceholder();
      return;
    }

    await fetchWeatherByCity(savedCity);
  } catch (error) {
    console.error('Error refreshing weather:', error);

    if (weatherMode === 'auto' && savedCity) {
      try {
        await fetchWeatherByCity(savedCity);
        return;
      } catch (fallbackError) {
        console.error('Error refreshing fallback city weather:', fallbackError);
      }
    }

    setWeatherPlaceholder(
      weatherMode === 'auto' ? "Couldn't detect location" : 'Weather unavailable',
      weatherMode === 'auto' ? 'Open Settings to set a city manually.' : 'Check your city in Settings.'
    );
  }
}

function startWeatherRefreshLoop() {
  if (weatherRefreshInterval) {
    clearInterval(weatherRefreshInterval);
  }

  weatherRefreshInterval = setInterval(() => {
    refreshWeather().catch((error) => {
      console.error('Weather refresh loop failed:', error);
    });
  }, WEATHER_CACHE_TTL);
}

function getWeatherIcon(code) {
  // WMO Weather interpretation codes
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '❄️';
  if (code <= 99) return '⛈️';
  return '☁️';
}

function updateWeatherDisplay() {
  if (!weatherData) return;

  const tempUnit = useFahrenheit ? '°F' : '°C';
  const icon = getWeatherIcon(weatherData.code);

  document.getElementById('weatherTemp').textContent = `${weatherData.temp}${tempUnit} ${icon}`;
  document.getElementById('weatherCity').textContent = weatherData.city;
}

// Validate and save API key
async function validateAndSaveApiKey() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }

  // Disable button while validating
  saveApiKeyBtn.disabled = true;
  saveApiKeyBtn.textContent = 'Validating...';

  try {
    // Test the API key with a simple search request
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=lofi&maxResults=1&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Invalid API key');
    }

    // API key is valid, save it
    await setStoredApiKey(apiKey);

    // Show configured state
    apiKeyInputContainer.style.display = 'none';
    apiKeyConfiguredContainer.style.display = 'flex';

    // Auto-search lofi after validation
    await searchLiveVideos('lofi');
  } catch (error) {
    console.error('API key validation failed:', error);
    const friendlyMessage = error.message === 'Invalid API key'
      ? 'Invalid API key. Please check and try again.'
      : `Could not save API key: ${error.message || 'Unknown error'}`;
    alert(friendlyMessage);
  } finally {
    saveApiKeyBtn.disabled = false;
    saveApiKeyBtn.textContent = 'Save';
  }
}

// Edit API key
editApiKeyBtn.addEventListener('click', async () => {
  apiKeyInputContainer.style.display = 'flex';
  apiKeyConfiguredContainer.style.display = 'none';
  const storedKey = await getStoredApiKey();
  apiKeyInput.value = storedKey || '';
  apiKeyInput.focus();
});

// Save API key button
saveApiKeyBtn.addEventListener('click', validateAndSaveApiKey);

// Save on Enter key in API key input
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    validateAndSaveApiKey();
  }
});

// YouTube Live Video Browser
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

function getCachedSearch(query) {
  const cacheKey = `videoSearch_${query}`;
  const cached = localStorage.getItem(cacheKey);

  if (!cached) return null;

  try {
    const { results, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 3 hours)
    if (now - timestamp < CACHE_DURATION) {
      return results;
    } else {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (e) {
    console.error('Error reading cache:', e);
    return null;
  }
}

function setCachedSearch(query, results) {
  const cacheKey = `videoSearch_${query}`;
  const cacheData = {
    results,
    timestamp: Date.now()
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

function renderVideoCards(items) {
  videoResults.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'video-card';

    // Build DOM nodes manually to avoid executing untrusted HTML
    const videoId = item?.id?.videoId;
    const title = item?.snippet?.title || 'Live Stream';
    const channelTitle = item?.snippet?.channelTitle || 'Unknown Channel';
    const thumbnailUrl = item?.snippet?.thumbnails?.medium?.url || '';

    if (!videoId) {
      return;
    }

    const thumb = document.createElement('div');
    thumb.className = 'video-card-thumb';

    const img = document.createElement('img');
    img.alt = title;
    if (thumbnailUrl) {
      img.src = thumbnailUrl;
    }
    thumb.appendChild(img);

    const liveBadge = document.createElement('span');
    liveBadge.className = 'video-card-live';
    liveBadge.textContent = 'LIVE';
    thumb.appendChild(liveBadge);

    const info = document.createElement('div');
    info.className = 'video-card-info';

    const titleEl = document.createElement('div');
    titleEl.className = 'video-card-title';
    titleEl.textContent = title;
    titleEl.title = title;

    const channelEl = document.createElement('div');
    channelEl.className = 'video-card-channel';
    channelEl.textContent = channelTitle;
    channelEl.title = channelTitle;

    info.appendChild(titleEl);
    info.appendChild(channelEl);

    card.appendChild(thumb);
    card.appendChild(info);
    card.dataset.videoId = videoId;

    card.addEventListener('click', () => {
      streamUrlInput.value = `https://www.youtube.com/watch?v=${videoId}`;
      streamUrlInput.focus();
    });

    videoResults.appendChild(card);
  });
}

async function searchLiveVideos(query) {
  const apiKey = await getStoredApiKey();

  if (!apiKey) {
    videoResults.innerHTML = '<p class="browser-hint">Enter an API key above to search live videos</p>';
    return;
  }

  // Check cache first
  const cachedResults = getCachedSearch(query);
  if (cachedResults) {
    renderVideoCards(cachedResults);
    return;
  }

  // Disable search button while loading
  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';
  videoResults.innerHTML = '<p class="browser-hint">Loading...</p>';

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      videoResults.innerHTML = '<p class="browser-hint">No live videos found</p>';
      return;
    }

    // Cache the results
    setCachedSearch(query, data.items);

    // Render video cards
    renderVideoCards(data.items);

  } catch (error) {
    console.error('Error searching videos:', error);
    videoResults.innerHTML = '<p class="browser-hint">Error: Check your API key and try again</p>';
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

// Search button click
searchBtn.addEventListener('click', () => {
  const query = videoSearchInput.value.trim() || 'lofi';
  searchLiveVideos(query);
});

// Search on Enter key
videoSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = videoSearchInput.value.trim() || 'lofi';
    searchLiveVideos(query);
  }
});

// Pomodoro Timer
const pomodoroTimer = document.getElementById('pomodoroTimer');
const pomodoroBtn = document.getElementById('pomodoroBtn');
const pomodoroResetBtn = document.getElementById('pomodoroReset');
const pomodoroDots = document.querySelectorAll('.pom-dot');

let pomodoroRenderInterval = null;
let pomodoroState = getDefaultPomodoroState();

// Pomodoro settings (minutes)
let pomodoroWorkDuration = 25;
let pomodoroBreakDuration = 5;
let pomodoroLongBreakDuration = 15;
let pomodoroPulseSpeed = 3; // seconds

function formatPomodoroTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getPomodoroSecondsLeft(state = pomodoroState) {
  if (state.status === 'running' && state.endTime) {
    return Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
  }

  return state.remainingSeconds;
}

function getPomodoroButtonLabel(state = pomodoroState) {
  if (state.status === 'running') {
    return 'Pause';
  }

  if (state.status === 'paused') {
    return 'Resume';
  }

  return state.mode === 'work' ? 'Start' : 'Start Break';
}

function updatePomodoroDots() {
  pomodoroDots.forEach((dot, index) => {
    dot.classList.remove('completed', 'active');

    if (index < pomodoroState.sessionsCompleted) {
      dot.classList.add('completed');
    } else if (index === pomodoroState.sessionsCompleted && pomodoroState.status === 'running') {
      dot.classList.add('active');
    }
  });
}

function updatePomodoroTitle() {
  if (pomodoroState.status !== 'running') {
    document.title = 'Lofi New Tab';
    return;
  }

  const secondsLeft = getPomodoroSecondsLeft();
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  if (mins > 0) {
    document.title = `Lofi New Tab - ${mins}m`;
  } else {
    document.title = `Lofi New Tab - ${secs}s`;
  }
}

function renderPomodoro() {
  pomodoroTimer.textContent = formatPomodoroTime(getPomodoroSecondsLeft());
  pomodoroBtn.textContent = getPomodoroButtonLabel();
  updatePomodoroDots();
  updatePomodoroTitle();
}

function setPomodoroState(nextState) {
  pomodoroState = normalizePomodoroState(nextState);
  pomodoroWorkDuration = pomodoroState.workDuration;
  pomodoroBreakDuration = pomodoroState.breakDuration;
  pomodoroLongBreakDuration = pomodoroState.longBreakDuration;

  renderPomodoro();
}

function startPomodoroRenderLoop() {
  if (pomodoroRenderInterval) {
    clearInterval(pomodoroRenderInterval);
  }

  pomodoroRenderInterval = setInterval(renderPomodoro, 1000);
  renderPomodoro();
}

async function persistPomodoroState(nextState) {
  const savedState = await setSharedPomodoroState(nextState);
  setPomodoroState(savedState);
  return savedState;
}

async function startPomodoro() {
  const secondsLeft = getPomodoroSecondsLeft();
  await persistPomodoroState({
    ...pomodoroState,
    status: 'running',
    endTime: Date.now() + (secondsLeft * 1000),
    remainingSeconds: secondsLeft,
    transitionAt: null,
    transitionTitle: '',
    transitionBody: '',
  });
}

async function pausePomodoro() {
  await persistPomodoroState({
    ...pomodoroState,
    status: 'paused',
    endTime: null,
    remainingSeconds: getPomodoroSecondsLeft(),
    transitionAt: null,
    transitionTitle: '',
    transitionBody: '',
  });
}

async function resetPomodoro() {
  await persistPomodoroState({
    ...pomodoroState,
    status: 'idle',
    mode: 'work',
    endTime: null,
    remainingSeconds: pomodoroWorkDuration * 60,
    sessionsCompleted: 0,
    transitionAt: null,
    transitionTitle: '',
    transitionBody: '',
  });
}

pomodoroBtn.addEventListener('click', async () => {
  if (pomodoroState.status === 'running') {
    await pausePomodoro();
  } else {
    await startPomodoro();
  }
});

// Reset button click
pomodoroResetBtn.addEventListener('click', async () => {
  await resetPomodoro();
});

// Double-click timer to reset
pomodoroTimer.addEventListener('dblclick', async () => {
  await resetPomodoro();
});

if (hasChromePomodoroMessaging()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[POMODORO_STATE_KEY]?.newValue) {
      return;
    }

    setPomodoroState(changes[POMODORO_STATE_KEY].newValue);
  });
} else {
  window.addEventListener('storage', (event) => {
    if (event.key !== POMODORO_STATE_KEY || !event.newValue) {
      return;
    }

    setPomodoroState(JSON.parse(event.newValue));
  });
}

startPomodoroRenderLoop();

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Changelog modal
const changelogModal = document.getElementById('changelogModal');
const closeChangelogModal = document.getElementById('closeChangelogModal');
const closeChangelogBtn = document.getElementById('closeChangelogBtn');

// Close changelog modal
function hideChangelogModal() {
  changelogModal.classList.remove('show');
  chrome.storage.local.set({ showChangelog: false });
}

closeChangelogModal.addEventListener('click', hideChangelogModal);
closeChangelogBtn.addEventListener('click', hideChangelogModal);

// Close modal when clicking outside
changelogModal.addEventListener('click', (e) => {
  if (e.target === changelogModal) {
    hideChangelogModal();
  }
});

// Check if we should show changelog on page load
chrome.storage.local.get(['showChangelog'], (result) => {
  if (result.showChangelog === true) {
    // Update version number in modal
    const version = chrome.runtime.getManifest().version;
    document.getElementById('changelogVersion').textContent = version;

    // Show the modal
    changelogModal.classList.add('show');
  }
});

// Load settings on page load
loadSettings().catch((error) => {
  console.error('Error loading settings:', error);
});
