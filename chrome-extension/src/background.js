// Background script for handling messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "triggerButtonClick") {
    // Forward the message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {
        action: "clickButtonAndGetHTML"
      }, (response) => {
        sendResponse(response);
      });
    });
    return true; // Indicates we want to send a response asynchronously
  }
});
