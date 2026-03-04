# Pomodoro Timer — Chrome Extension

A clean, minimal Pomodoro timer Chrome extension with a popup UI and live badge countdown.

## Features

- **25-minute work sessions** and **5-minute break sessions**
- **Start, Pause, and Reset** controls
- **Circular progress ring** — red for work, green for break
- **Badge countdown** on the extension icon showing remaining time (MM:SS)
- Timer keeps running in the background even when the popup is closed
- Mode switching (Work / Break) with a single click

## Screenshots

| Work Mode | Break Mode |
|-----------|------------|
| Red progress ring, 25:00 countdown | Green progress ring, 5:00 countdown |

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `pomodoro-extension` folder

The extension will appear in your Chrome toolbar.

## Usage

- Click the 🍅 icon in your toolbar to open the timer
- Press **Start** to begin a session
- Press **Pause** to pause mid-session
- Press **Reset** to return to 25:00
- Switch between **Work** and **Break** tabs to change modes (only when timer is stopped)

## File Structure

```
pomodoro-extension/
├── manifest.json     # Chrome extension config (Manifest V3)
├── background.js     # Service worker — manages timer state and badge
├── popup.html        # Popup UI markup
├── popup.css         # Styles
└── popup.js          # Popup logic and background communication
```

## How It Works

- The background service worker stores timer state using `chrome.storage.session`
- When running, an `endTime` timestamp is saved — so the timer stays accurate even if the service worker is restarted
- `chrome.alarms` fires the end-of-session event and updates the badge every second
- The popup polls the background every 500ms while open to keep the display in sync
