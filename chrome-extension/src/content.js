import config from './config';
import React from 'react';
import { createRoot } from 'react-dom/client';

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
    return true;
  }
});

async function clickButtonAndGetHTML() {
  return new Promise((resolve, reject) => {
    console.log(document)
    const button = document.querySelector(config.BUTTON_SELECTOR);
    if (!button) {
      reject(new Error(`Button not found with selector: ${config.BUTTON_SELECTOR}`));
      return;
    }

    const observer = new MutationObserver((_, obs) => {
      setTimeout(() => {
        obs.disconnect();
        resolve(document.documentElement.outerHTML);
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    button.click();
  });
}

function getCurrentVideoTime() {
  const videoElement = document.querySelector('video');

  if (videoElement) {
    return Math.round(videoElement.currentTime);
  }

  return 0;
}

function setupTimeTracking() {
  setInterval(() => {
    const currentTime = getCurrentVideoTime();

    chrome.runtime.sendMessage({
      action: 'UPDATE_VIDEO_TIME',
      currentTime: currentTime
    });
  }, 1000);

}

// Initialize when the page is ready
function initTimeTracking() {
  // Check if video element exists
  if (document.querySelector('video')) {
    setupTimeTracking();
  } else {
    // Try again shortly
    setTimeout(initTimeTracking, 1000);
  }
}

initTimeTracking();

const CustomComponent = () => {
  return (
    <div>
      <p>test!</p>
    </div>
  );
};

const observer = new MutationObserver((mutations, obs) => {
  const relatedElement = document.querySelector("#columns").lastElementChild.lastElementChild.lastElementChild;

  if (relatedElement) {
    relatedElement.style.height = 'calc(100vh - 95px)';
    relatedElement.style.background = 'red'

    while (relatedElement.firstChild) {
      relatedElement.removeChild(relatedElement.firstChild);
    }

    const root = createRoot(relatedElement);
    root.render(<CustomComponent />);

    obs.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
