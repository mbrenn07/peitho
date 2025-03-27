import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "./config";

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState("0:00");
  const [utterances, setUtterances] = useState({});

  useEffect(() => {
    const handleMessage = (message) => {
      if (message.action === "UPDATE_VIDEO_TIME") {
        console.log(message.currentTime);
        setCurrentVideoTime(message.currentTime);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleExtractHTML = async () => {
    setLoading(true);
    setStatus(null);

    chrome.runtime.sendMessage(
      { action: "triggerButtonClick" },
      async (response) => {
        if (chrome.runtime.lastError) {
          setStatus({
            type: "error",
            message: chrome.runtime.lastError.message,
          });
          setLoading(false);
          return;
        }

        if (response && response.success) {
          axios
            .post(`${config.BACKEND_URL}/process_transcript`, {
              html: response.html,
            })
            .then((data) => {
              console.log(data);
              setUtterances(data.data.success);
              setStatus({
                type: "success",
                message: "HTML successfully extracted and sent to backend!",
              });
            })
            .catch((error) => {
              console.error(error);
              setStatus({
                type: "error",
                message: `Error sending to backend: ${error.message}`,
              });
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      }
    );
  };
  // Send the extracted utterances to the content script
  useEffect(() => {
    if (Object.keys(utterances).length > 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "UPDATE_FROM_POPUP",
          utterances: utterances,
        });
      });
    }
  }, [utterances]);

  return (
    <div className="App" style={styles.container}>
      <h1 style={styles.title}>Peitho</h1>

      <div style={styles.infoBox}>
        <p>Time: {currentVideoTime}</p>
        <p>
          <strong>Target Button:</strong> {config.BUTTON_SELECTOR}
        </p>
        <p>
          <strong>Backend URL:</strong> {config.BACKEND_URL}
        </p>
        
      </div>

      <button
        style={{
          ...styles.button,
          ...(loading ? styles.buttonDisabled : {}),
        }}
        onClick={handleExtractHTML}
        disabled={loading}
      >
        {loading ? "Processing..." : "Click Button & Extract HTML"}
      </button>

      {status && (
        <div
          style={{
            ...styles.status,
            ...(status.type === "success"
              ? styles.statusSuccess
              : styles.statusError),
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    width: "300px",
    padding: "16px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "18px",
    marginBottom: "16px",
  },
  infoBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "16px",
    fontSize: "12px",
  },
  button: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#4285f4",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
  },
  status: {
    marginTop: "16px",
    padding: "8px",
    borderRadius: "4px",
  },
  statusSuccess: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
  statusError: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
};

export default App;
