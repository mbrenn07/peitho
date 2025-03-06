import config from './config';

// Content script that runs in the context of the webpage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clickButtonAndGetHTML") {
    clickButtonAndGetHTML()
      .then(html => {
        sendResponse({ success: true, html: html });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates we want to send a response asynchronously
  }
});

async function clickButtonAndGetHTML() {
  return new Promise((resolve, reject) => {
    const button = document.querySelector(config.BUTTON_SELECTOR);
    
    if (!button) {
      reject(new Error(`Button not found with selector: ${config.BUTTON_SELECTOR}`));
      return;
    }
    
    // Create a MutationObserver to watch for DOM changes after the button click
    const observer = new MutationObserver((mutations, obs) => {
      // Wait a small amount of time to ensure all DOM changes are completed
      setTimeout(() => {
        obs.disconnect();
        
        const html = document.documentElement.outerHTML;
        resolve(html); // Return the HTML without sending it anywhere
        
      }, 1000);
    });
    
    // Start observing changes to the DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    button.click();
  });
}
