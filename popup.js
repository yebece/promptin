// Popup script for Chrome Extension
// Gets the current tab URL and displays it in the popup

document.addEventListener('DOMContentLoaded', function() {
  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;
    
    // Display the URL in the popup
    document.getElementById('currentUrl').textContent = currentUrl;
  });
}); 