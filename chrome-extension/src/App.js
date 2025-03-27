import React, { useState, useEffect } from "react";

function App() {
  const [currentVideoTime, setCurrentVideoTime] = useState("0:00");

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

  return (
    <div className="App" style={styles.container}>
      <h1 style={styles.title}>Peitho</h1>

      <div style={styles.infoBox}>
        <p>Time: {currentVideoTime}</p> 
      </div>
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
};

export default App;
