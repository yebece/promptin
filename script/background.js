/**
 * Promptin Background Script
 * Handles message passing between content scripts and extension storage
 */

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPromptinDB') {
    // Get the database from chrome.storage.local
    chrome.storage.local.get(['promptinJsonDB'], (result) => {
      const database = result.promptinJsonDB || null;
      sendResponse({ database: database });
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Optional: Log when background script starts
console.log('Promptin background script loaded'); 