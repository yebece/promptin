// Popup script for Chrome Extension
// Gets the current tab URL and displays it in the popup

function getPromptinJsonDB() {
  return JSON.parse(localStorage.getItem("promptinJsonDB"));
}

function getPromptById(id) {
  return getPromptinJsonDB()[id];
}

function getPromptByUrl(url) {
  return getPromptinJsonDB().find(prompt => prompt.url === url);
}

function getPromptByDomain(domain) {
  return getPromptinJsonDB().find(prompt => prompt.url.includes(domain));
}

function getTabURL() {
  return chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    return tabs[0].url;
  });
}

var selectedPrompt = -1;

if (getPromptByUrl(getTabURL()) !== undefined || getTabURL().includes(getPromptByDomain(getTabURL()).url)) {
  console.log(getPromptByUrl(getTabURL()).prompt);
  selectedPrompt = getPromptByUrl(getTabURL());
} else {
  console.log("No prompt found");
  selectedPrompt = -1;
}

if (getPromptinJsonDB() === null) {
localStorage.setItem("promptinJsonDB", JSON.stringify([
    {
    title: "Welcome to Promptin!",
    url: "https://www.github.com/yebece/promptin",
    prompt: "Thank you for installing Promptin! You can support me by starring the repo on GitHub. You can safely delete this prompt now.",
    target: 1, // 0: Domain, 1: Specific URL, 2: All Websites
    timestamp: Date.now(),
    id: 0
    },
  ]));
}


function addPrompt(title, url, prompt, target, timestamp) {
  var promptinJsonDB = getPromptinJsonDB();
  getPromptinJsonDB().unshift({
    title: title,
    url: url,
    prompt: prompt,
    target: target,
    timestamp: timestamp,
    id: promptinJsonDB.length + 1
  });
  localStorage.setItem("promptinJsonDB", JSON.stringify(getPromptinJsonDB()));
  console.log(getPromptinJsonDB());
}

function removePrompt(id) {
  var promptinJsonDB = getPromptinJsonDB();
  promptinJsonDB.splice(id, 1);
  localStorage.setItem("promptinJsonDB", JSON.stringify(promptinJsonDB));
  console.log(getPromptinJsonDB());
}

function updatePrompt(id, title, url, prompt, target, timestamp) {
  var promptinJsonDB = getPromptinJsonDB();
  promptinJsonDB[id] = {
    title: title,
    url: url,
    prompt: prompt,
    target: target,
    timestamp: timestamp,
    id: id
  };
  localStorage.setItem("promptinJsonDB", JSON.stringify(promptinJsonDB));
  console.log(getPromptinJsonDB());
}

function duplicatePrompt(id) {
  addPrompt(getPromptById(id).title, getPromptById(id).url, getPromptById(id).prompt, getPromptById(id).target, getPromptById(id).timestamp);
}

console.log(getPromptinJsonDB());

document.addEventListener('DOMContentLoaded', function() {
  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;
    
    // Display the URL in the popup
    document.getElementById('currentUrl').textContent = currentUrl;
  });
}); 