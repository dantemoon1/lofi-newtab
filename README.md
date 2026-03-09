# Lofi New Tab

![Hero banner](docs/hero-banner.jpg)

Lofi New Tab replaces the blank Chrome start page with a calm YouTube background, a clean clock, optional weather, and a Pomodoro focus timer. Everything stays configurable in a single settings modal, making it a peaceful landing pad every time you open a new tab.

## Features
- Set any YouTube video or playlist as the background
- Quick mute/unmute and fullscreen controls
- Customizable clock (12/24-hour), position, overlay color, and opacity
- Weather widget with Celsius/Fahrenheit, manual city lookup, and optional approximate auto-location
- Shared Pomodoro timer that stays in sync across tabs and refreshes
- Background Pomodoro notifications when work or break sessions end
- YouTube search support when you provide your own API key
- About tab with Ko-fi link and direct contact info

## Screenshots
![Screenshot: main new tab](docs/screenshot-new-tab.jpg)
![Screenshot: settings modal](docs/settings-display.png)
![Screenshot: pomodoro settings](docs/settings-pomodoro.png)
![Screenshot: video settings](docs/settings-video.png)

## Development
```bash
# Install dependencies (none required)
# Load the unpacked extension in Chrome or Edge:
chrome://extensions/ -> Developer mode -> Load unpacked -> select the repo directory

# Optional: build a release zip
zip -r release/lofi-newtab-1.2.0.zip manifest.json newtab.html newtab.css newtab.js background.js icons
```

## Privacy
All preferences are stored in local storage or chrome.storage (sync when available). Network requests are limited to the YouTube Data API (for search and validation), Open-Meteo (for weather), optionally ifconfig.co when approximate auto-location is enabled for weather, and YouTube embeds for the background player. No personal data is collected or sent to the developer.

## License
MIT
