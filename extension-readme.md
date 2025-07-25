# Chrome Extension Template

A blank Chrome extension template that captures the current page URL.

## Files

- `manifest.json` - Extension configuration file
- `content.js` - Content script that runs on all pages and gets the current URL
- `popup.html` - Popup window interface
- `popup.js` - Popup script that displays current tab URL

## How to Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this folder
5. The extension will now be loaded

## How to Test

### Content Script:
1. Navigate to any website
2. Open Chrome DevTools (F12)
3. Check the Console tab
4. You should see the current page URL logged

### Popup:
1. Navigate to any website
2. Click the extension icon in the Chrome toolbar
3. A popup window will appear showing the current page URL

## Usage

The `currentPageUrl` variable in `content.js` contains the current page URL and is available for your use. 