import config from "./config";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

async function clickButtonAndGetHTML() {
  return new Promise((resolve, reject) => {
    console.log(document);
    const button = document.querySelector(config.BUTTON_SELECTOR);
    if (!button) {
      reject(
        new Error(`Button not found with selector: ${config.BUTTON_SELECTOR}`)
      );
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
      characterData: true,
    });

    button.click();
  });
}

function getCurrentVideoTime() {
  const videoElement = document.querySelector("video");

  if (videoElement) {
    return Math.round(videoElement.currentTime);
  }

  return 0;
}

function setupTimeTracking() {
  setInterval(() => {
    const currentTime = getCurrentVideoTime();

    chrome.runtime.sendMessage({
      action: "UPDATE_VIDEO_TIME",
      currentTime: currentTime,
    });
  }, 1000);
}

function initTimeTracking() {
  if (document.querySelector("video")) {
    setupTimeTracking();
  } else {
    setTimeout(initTimeTracking, 1000);
  }
}

initTimeTracking();

const CustomComponent = () => {
  const [currentVideoTime, setCurrentVideoTime] = useState("0:00");
  const [utterances, setUtterances] = useState({});
  const [textColor, setTextColor] = useState("#000"); // fallback color

  useEffect(() => {
    const ytElement =
      document.querySelector("#container h1") ||
      document.querySelector("#title");
    if (ytElement) {
      const computedColor = window.getComputedStyle(ytElement).color;
      setTextColor(computedColor);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const video = document.querySelector("video");
      if (video) {
        setCurrentVideoTime(Math.floor(video.currentTime));
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const transcriptObserver = new MutationObserver((mutations, obs) => {
      const button = document.querySelector(config.BUTTON_SELECTOR);
    
    
      if (button) {
        clickButtonAndGetHTML()
    .then((html) => {
      axios
      .post(`${config.BACKEND_URL}/process_transcript`, {
        html: html,
      })
      .then((data) => {
        console.log(data);
        const utterances = data.data.success;
        setUtterances(utterances)
      })
      .catch((error) => {
        console.error(error);
      })
      const closeButton = document.querySelector('[aria-label="Close transcript"]');
      if (closeButton) {
        closeButton.click();
      }
    });
    
        obs.disconnect();
      }
    });
    
    transcriptObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });    
  }, []);

  const timeToSeconds = (timeString) => {
    const [minutes, seconds] = timeString.split(":").map(Number);
    return minutes * 60 + seconds;
  };

  const styles = {
    container: {
      padding: "2rem",
      color: textColor,
      borderRadius: "12px",
      border:
        textColor === "rgb(15, 15, 15)"
          ? "1px solid rgba(0,0,0,0.1)"
          : "1px solid rgba(255,255,255,0.2)",
      background: textColor === "rgb(15, 15, 15)" ? "#FFF" : "#212121",
      fontFamily: "Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      gap: "1rem",
    },
    time: {
      color: "#3ea6ff",
      padding: "0 4px",
      fontSize: "1.3rem",
      fontWeight: "500",
      lineHeight: "1.8rem",
      background: "#263850",
      borderRadius: "4px",
      width: "fit-content",
      height: "fit-content",
    },
    utterance: { display: "flex", gap: "1rem" },
    labels: { display: "flex", gap: ".5rem", flexWrap: "wrap" },
    label: {
      padding: "0.5rem",
      background: "#3ea6ff",
      borderRadius: "4px",
    },
  };

  return (
    <div style={styles.container}>
      <h1>AI Utterance Analysis</h1>

      {/* <p>Current Video Time: {currentVideoTime} seconds</p> */}
      {Object.entries(utterances)
        .filter(([time]) => timeToSeconds(time) <= currentVideoTime)
        .slice(-1)
        .map(([time, text]) => (
          <div key={time} style={styles.utterance}>
            <p style={styles.time}>{time}</p>
            <h2>"{text.text}"</h2>
          </div>
        ))}

      {/* place holders below */}
      <h2>Current Labels:</h2>
      <div style={styles.labels}>
        {Object.entries(utterances)
          .filter(([time]) => timeToSeconds(time) <= currentVideoTime)
          .slice(-1)
          .map(([_, text]) => (
            <p style={styles.label}>{text.labels}</p>
          ))}
      </div>
    
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={Object.entries(utterances)
            .filter(([time]) => timeToSeconds(time) <= currentVideoTime)
            .map(([_, value]) => value.labels)
            .filter((label, index, self) => self.indexOf(label) === index)
            .map((label) => ({
              name: label,
              value: Object.entries(utterances)
                .filter(([time]) => timeToSeconds(time) <= currentVideoTime)
                .filter(([_, text]) => text.labels === label).length,
            }))
            .sort((a, b) => b.value - a.value)}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 60,
          }}
        >
          <XAxis
            dataKey="name"
            // label={{
            //   value: "Categories",
            //   position: "bottom",
            //   offset: 0,
            // }}
            interval={0}
            tick={{
              angle: 60,
              textAnchor: "start",
              dx: -5,
              dy: 10,
            }}
          />

          <YAxis
            label={{
              value: "Frequency",
              angle: -90,
              position: "insideLeft",
            }}
          />
          {/* <Tooltip /> */}
          <Bar dataKey="value" fill="#3ea6ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const recommendationObserver = new MutationObserver((mutations, obs) => {
  const recommendationBar =
    document.querySelector("#columns").lastElementChild.lastElementChild
      .lastElementChild;

  if (recommendationBar) {
    recommendationBar.style.height = "calc(100vh - 95px)";
    // recommendationBar.style.background = "red";

    while (recommendationBar.firstChild) {
      recommendationBar.removeChild(recommendationBar.firstChild);
    }

    const root = createRoot(recommendationBar);
    root.render(<CustomComponent />);

    obs.disconnect();
  }
});

recommendationObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

const progressBarObserver = new MutationObserver((mutations, obs) => {
  const progressBar =
    document.querySelector(".ytp-progress-bar");

  if (progressBar) {
    progressBar.style.height = "20px";

    obs.disconnect();
  }
});

progressBarObserver.observe(document.body, {
  childList: true,
  subtree: true,
});