// Fix for YouTube Error 153 in Chrome extensions
// Source: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/OUJad0q-d_g
//
// Chrome doesn't send the Referer header for iframes in extension pages,
// but YouTube now requires this header. This rule adds it for YouTube embeds.

const iframeHosts = [
  'www.youtube.com',
];

chrome.runtime.onInstalled.addListener((details) => {
  // Set up YouTube referer fix
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
        {header: 'referer', value: chrome.runtime.id, operation: 'set'},
      ],
    },
  };
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE.id],
    addRules: [RULE],
  });

  // Set flag to show changelog on update (but not on fresh install)
  if (details.reason === 'update') {
    chrome.storage.local.set({ showChangelog: true });
  }
});
