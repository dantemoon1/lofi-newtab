let use24Hour = true;

// Video overlay interaction
const videoOverlay = document.getElementById('videoOverlay');
const videoHint = document.getElementById('videoHint');
let overlayRemoved = false;
let interactionTimeout = null;

videoOverlay.addEventListener('click', () => {
  if (!overlayRemoved) {
    // First click - remove overlay and hide hint
    videoOverlay.style.pointerEvents = 'none';
    videoHint.style.display = 'none';
    overlayRemoved = true;
    console.log('Video overlay disabled - click again to interact');

    // Reset after 60 seconds of inactivity
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => {
      videoOverlay.style.pointerEvents = 'auto';
      videoHint.style.display = 'block';
      overlayRemoved = false;
      console.log('Video overlay re-enabled');
    }, 60000);
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
      console.log('Video overlay re-enabled after inactivity');
    }, 60000);
  }
});

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');

  if (!use24Hour) {
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    document.getElementById('time').textContent = `${h}:${m} ${period}`;
  } else {
    h = h.toString().padStart(2, '0');
    document.getElementById('time').textContent = `${h}:${m}`;
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
  console.log('Mute toggle clicked!');
  try {
    if (isMuted) {
      // Unmute
      iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', YT_ORIGIN);
      muteToggle.textContent = '🔊 Mute';
      muteToggle.title = 'Click to mute';
      console.log('Sent unmute command to iframe');
    } else {
      // Mute
      iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', YT_ORIGIN);
      muteToggle.textContent = '🔇 Unmute';
      muteToggle.title = 'Click to unmute';
      console.log('Sent mute command to iframe');
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
const useFahrenheitCheckbox = document.getElementById('useFahrenheit');
const showWeatherCheckbox = document.getElementById('showWeather');
const clockPositionInput = document.getElementById('clockPosition');
const infoPositionInput = document.getElementById('infoPosition');
const veilOpacityInput = document.getElementById('veilOpacity');
const veilOpacityValue = document.getElementById('veilOpacityValue');
const veilSwatches = document.querySelectorAll('.veil-swatch');
const veilPreview = document.getElementById('veilPreview');
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
    console.log('Migrated YouTube API key to chrome.storage');
  } catch (error) {
    console.error('Failed to migrate legacy API key:', error);
  }
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

function updateVeilPreview(color, opacity) {
  const rgb = VEIL_COLORS[color];
  const alpha = opacity / 100;
  veilPreview.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
  // If it's already just an ID, return it
  if (!url.includes('youtube.com') && !url.includes('youtu.be') && url.length === 11) {
    return url;
  }

  // Handle youtube.com/watch?v=... URLs
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Handle youtu.be/... URLs
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/embed/... URLs
  const embedMatch = url.match(/\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

// Load saved video URL from localStorage
async function loadSettings() {
  await migrateLegacyApiKey();

  const savedUrl = localStorage.getItem('videoUrl') || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  streamUrlInput.value = savedUrl;
  const videoId = extractVideoId(savedUrl);
  if (videoId) {
    updateIframeSrc(videoId, true);
  }

  // Load 24-hour clock preference
  use24Hour = localStorage.getItem('use24Hour') !== 'false';
  use24hCheckbox.checked = use24Hour;
  updateClock();

  // Load weather settings
  const savedCity = localStorage.getItem('weatherCity');
  if (savedCity) {
    weatherCityInput.value = savedCity;
    fetchWeather(savedCity);
  }

  useFahrenheit = localStorage.getItem('useFahrenheit') === 'true';
  useFahrenheitCheckbox.checked = useFahrenheit;

  // Load show weather preference
  const showWeather = localStorage.getItem('showWeather') !== 'false'; // default true
  showWeatherCheckbox.checked = showWeather;
  document.getElementById('weather').style.display = showWeather ? 'block' : 'none';

  // Load position settings
  const clockPos = localStorage.getItem('clockPosition') || '10';
  const infoPos = localStorage.getItem('infoPosition') || '5';
  clockPositionInput.value = clockPos;
  infoPositionInput.value = infoPos;
  document.getElementById('clock').style.top = `${clockPos}%`;
  document.getElementById('info').style.bottom = `${infoPos}%`;

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
  pomodoroWorkDuration = parseInt(localStorage.getItem('pomodoroWork') || '25');
  pomodoroBreakDuration = parseInt(localStorage.getItem('pomodoroBreak') || '5');
  pomodoroLongBreakDuration = parseInt(localStorage.getItem('pomodoroLongBreak') || '15');
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

  // Apply veil and update preview
  updateVeil(currentVeilColor, currentVeilOpacity);
  updateVeilPreview(currentVeilColor, currentVeilOpacity);

  resetPomodoro();
}

// Update iframe src with new video ID
function updateIframeSrc(videoId, videoChanged = false) {
  const newSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&iv_load_policy=3&enablejsapi=1&loop=1&playlist=${videoId}`;

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
  updateVeilPreview(currentVeilColor, opacity);
});

// Veil color swatches
veilSwatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    // Remove active class from all swatches
    veilSwatches.forEach(s => s.classList.remove('active'));
    // Add active class to clicked swatch
    swatch.classList.add('active');

    currentVeilColor = swatch.dataset.color;
    updateVeilPreview(currentVeilColor, currentVeilOpacity);
  });
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

  // Update preview
  updateVeilPreview(currentVeilColor, currentVeilOpacity);

  console.log('Veil reset to defaults: gray, 45%');
});

// Open settings modal
settingsBtn.addEventListener('click', async () => {
  console.log('Settings button clicked!');
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
saveSettings.addEventListener('click', () => {
  const url = streamUrlInput.value.trim() || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  const videoId = extractVideoId(url);

  if (!videoId) {
    alert('Invalid YouTube URL. Please check and try again.');
    return;
  }

  // Check if video URL actually changed
  const oldUrl = localStorage.getItem('videoUrl') || `https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`;
  const oldVideoId = extractVideoId(oldUrl);
  const videoChanged = videoId !== oldVideoId;

  localStorage.setItem('videoUrl', url);
  localStorage.setItem('use24Hour', use24hCheckbox.checked);
  use24Hour = use24hCheckbox.checked;

  // Save show weather preference
  const showWeather = showWeatherCheckbox.checked;
  localStorage.setItem('showWeather', showWeather);
  document.getElementById('weather').style.display = showWeather ? 'block' : 'none';

  // Save weather settings
  const city = weatherCityInput.value.trim();
  if (city) {
    localStorage.setItem('weatherCity', city);
    useFahrenheit = useFahrenheitCheckbox.checked;
    localStorage.setItem('useFahrenheit', useFahrenheit);
    fetchWeather(city);
  } else {
    localStorage.removeItem('weatherCity');
    document.getElementById('weatherTemp').textContent = 'Set location in settings';
    document.getElementById('weatherCity').textContent = '';
  }

  // Save position settings
  const clockPos = clockPositionInput.value || '10';
  const infoPos = infoPositionInput.value || '5';
  localStorage.setItem('clockPosition', clockPos);
  localStorage.setItem('infoPosition', infoPos);
  document.getElementById('clock').style.top = `${clockPos}%`;
  document.getElementById('info').style.bottom = `${infoPos}%`;

  // Save show Pomodoro preference
  const showPomodoro = showPomodoroCheckbox.checked;
  localStorage.setItem('showPomodoro', showPomodoro);
  document.getElementById('pomodoro').style.display = showPomodoro ? 'flex' : 'none';

  // Save Pomodoro settings
  pomodoroWorkDuration = parseInt(pomodoroWorkInput.value || '25');
  pomodoroBreakDuration = parseInt(pomodoroBreakInput.value || '5');
  pomodoroLongBreakDuration = parseInt(pomodoroLongBreakInput.value || '15');
  pomodoroPulseSpeed = parseFloat(pomodoroPulseSpeedInput.value || '3');
  localStorage.setItem('pomodoroWork', pomodoroWorkDuration);
  localStorage.setItem('pomodoroBreak', pomodoroBreakDuration);
  localStorage.setItem('pomodoroLongBreak', pomodoroLongBreakDuration);
  localStorage.setItem('pomodoroPulseSpeed', pomodoroPulseSpeed);

  // Apply pulse speed to CSS
  document.documentElement.style.setProperty('--pom-pulse-speed', `${pomodoroPulseSpeed}s`);

  resetPomodoro();

  // Save veil settings
  localStorage.setItem('veilOpacity', currentVeilOpacity);
  localStorage.setItem('veilColor', currentVeilColor);
  updateVeil(currentVeilColor, currentVeilOpacity);

  // Note: API key is now saved separately via the Save button, not here

  updateIframeSrc(videoId, videoChanged);
  updateClock();
  settingsModal.classList.remove('show');
  console.log('Settings saved. Video ID:', videoId, '24h:', use24Hour, 'City:', city, 'Fahrenheit:', useFahrenheit, 'Clock:', clockPos, 'Info:', infoPos);
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

async function fetchWeather(city) {
  try {
    // First, geocode the city to get coordinates
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      console.error('City not found');
      return;
    }

    const { latitude, longitude, name } = geoData.results[0];

    // Fetch weather data
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=${useFahrenheit ? 'fahrenheit' : 'celsius'}`);
    const weather = await weatherResponse.json();

    weatherData = {
      temp: Math.round(weather.current.temperature_2m),
      code: weather.current.weather_code,
      city: name
    };

    updateWeatherDisplay();
  } catch (e) {
    console.error('Error fetching weather:', e);
  }
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

    console.log('API key validated and saved');
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
    console.log('Using cached results for:', query);
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

let pomodoroInterval = null;
let pomodoroTitleInterval = null;
let pomodoroSecondsLeft = 0;
let pomodoroMode = 'work'; // 'work', 'break', 'longBreak'
let pomodoroSessionsCompleted = 0;
let pomodoroRunning = false;
let notificationPermission = 'default';

// Pomodoro settings (minutes)
let pomodoroWorkDuration = 25;
let pomodoroBreakDuration = 5;
let pomodoroLongBreakDuration = 15;
let pomodoroPulseSpeed = 3; // seconds

// Request notification permission on first interaction
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    notificationPermission = await Notification.requestPermission();
    console.log('Notification permission:', notificationPermission);
  } else if ('Notification' in window) {
    notificationPermission = Notification.permission;
  }
}

// Show desktop notification
function showPomodoroNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23ff6b6b"/></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23ff6b6b"/></svg>',
      requireInteraction: false
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }
}

function formatPomodoroTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updatePomodoroDots() {
  pomodoroDots.forEach((dot, index) => {
    // Remove both classes first
    dot.classList.remove('completed', 'active');

    if (index < pomodoroSessionsCompleted) {
      // Completed sessions
      dot.classList.add('completed');
    } else if (index === pomodoroSessionsCompleted && pomodoroRunning) {
      // Current active session (only when running)
      dot.classList.add('active');
    }
  });
}

function updatePomodoroTitle() {
  if (!pomodoroRunning) {
    document.title = 'Lofi New Tab';
    return;
  }

  const mins = Math.floor(pomodoroSecondsLeft / 60);
  const secs = pomodoroSecondsLeft % 60;

  if (mins > 0) {
    document.title = `Lofi New Tab - ${mins}m`;
  } else {
    document.title = `Lofi New Tab - ${secs}s`;
  }
}

function startTitleUpdates() {
  // Clear any existing title update interval
  if (pomodoroTitleInterval) {
    clearInterval(pomodoroTitleInterval);
  }

  // Update title immediately
  updatePomodoroTitle();

  // Set interval based on remaining time
  const updateInterval = pomodoroSecondsLeft > 60 ? 60000 : 1000; // 1 min or 1 sec
  pomodoroTitleInterval = setInterval(() => {
    updatePomodoroTitle();

    // Switch to second updates when under 1 minute
    if (pomodoroSecondsLeft <= 60 && pomodoroTitleInterval) {
      clearInterval(pomodoroTitleInterval);
      pomodoroTitleInterval = setInterval(updatePomodoroTitle, 1000);
    }
  }, updateInterval);
}

function stopTitleUpdates() {
  if (pomodoroTitleInterval) {
    clearInterval(pomodoroTitleInterval);
    pomodoroTitleInterval = null;
  }
  document.title = 'Lofi New Tab';
}

function startPomodoro() {
  pomodoroRunning = true;
  pomodoroBtn.textContent = 'Pause';

  // Request notification permission on first start
  if (notificationPermission === 'default') {
    requestNotificationPermission();
  }

  // Update dots to show active state
  updatePomodoroDots();

  // Start title updates
  startTitleUpdates();

  pomodoroInterval = setInterval(() => {
    pomodoroSecondsLeft--;
    pomodoroTimer.textContent = formatPomodoroTime(pomodoroSecondsLeft);
    updatePomodoroTitle();

    if (pomodoroSecondsLeft <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      stopTitleUpdates();

      // Completed a session
      if (pomodoroMode === 'work') {
        pomodoroSessionsCompleted++;
        updatePomodoroDots();

        // Determine next mode
        if (pomodoroSessionsCompleted >= 4) {
          pomodoroMode = 'longBreak';
          pomodoroSecondsLeft = pomodoroLongBreakDuration * 60;
          pomodoroSessionsCompleted = 0; // Reset after long break
          updatePomodoroDots();
          showPomodoroNotification('Work session complete', `Time for a long break (${pomodoroLongBreakDuration} minutes)`);
        } else {
          pomodoroMode = 'break';
          pomodoroSecondsLeft = pomodoroBreakDuration * 60;
          showPomodoroNotification('Work session complete', `Time for a break (${pomodoroBreakDuration} minutes)`);
        }
        pomodoroBtn.textContent = 'Start Break';
      } else {
        // Break finished, back to work
        pomodoroMode = 'work';
        pomodoroSecondsLeft = pomodoroWorkDuration * 60;
        pomodoroBtn.textContent = 'Start';
        showPomodoroNotification('Break complete', `Ready to work? (${pomodoroWorkDuration} minutes)`);
      }

      pomodoroTimer.textContent = formatPomodoroTime(pomodoroSecondsLeft);
    }
  }, 1000);
}

function pausePomodoro() {
  pomodoroRunning = false;
  clearInterval(pomodoroInterval);
  pomodoroBtn.textContent = 'Resume';
  stopTitleUpdates();
  updatePomodoroDots(); // Remove active state when paused
}

function resetPomodoro() {
  pomodoroRunning = false;
  clearInterval(pomodoroInterval);
  stopTitleUpdates();
  pomodoroMode = 'work';
  pomodoroSecondsLeft = pomodoroWorkDuration * 60;
  pomodoroTimer.textContent = formatPomodoroTime(pomodoroSecondsLeft);
  pomodoroBtn.textContent = 'Start';
  pomodoroSessionsCompleted = 0;
  updatePomodoroDots();
}

pomodoroBtn.addEventListener('click', () => {
  if (!pomodoroRunning) {
    if (pomodoroSecondsLeft === 0 || pomodoroBtn.textContent === 'Start' || pomodoroBtn.textContent === 'Start Break') {
      // Starting fresh or after a break
      if (pomodoroSecondsLeft === 0) {
        pomodoroSecondsLeft = pomodoroWorkDuration * 60;
      }
      startPomodoro();
    } else {
      // Resuming
      startPomodoro();
    }
  } else {
    pausePomodoro();
  }
});

// Reset button click
pomodoroResetBtn.addEventListener('click', () => {
  resetPomodoro();
  console.log('Pomodoro reset via button');
});

// Double-click timer to reset
pomodoroTimer.addEventListener('dblclick', () => {
  resetPomodoro();
  console.log('Pomodoro reset via double-click');
});

// Initialize pomodoro
resetPomodoro();

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Load settings on page load
loadSettings().catch((error) => {
  console.error('Error loading settings:', error);
});
