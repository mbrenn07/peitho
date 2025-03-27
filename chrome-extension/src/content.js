import config from "./config";
import React, { useState, useEffect, useRef } from "react";
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
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [utterances, setUtterances] = useState([]);
  const utterancesRef = useRef();
  const currentVideoTimeRef = useRef();
  const [textColor, setTextColor] = useState("#000"); // fallback color

  const labelToColor = {
    "Self Claims - Political Track Record": "red",
    "General Claim Statistical": "blue",
    "Communicative Metareference": "green",
    "Gratitude/Congratulations": "purple",
    "General Claim Non-statistical": "yellow",
  }

  useEffect(() => {
    utterancesRef.current = utterances
  }, [utterances])

  useEffect(() => {
    currentVideoTimeRef.current = currentVideoTime
  }, [currentVideoTime])

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
        setCurrentVideoTime(video.currentTime * 1000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    axios
      .post(`${config.BACKEND_URL}/process_transcript`, {
        url: window.location.href,
      })
      .then((data) => {
        const utterances = data.data.utterances.sort((a, b) => a.start - b.start);
        setUtterances(utterances)
      })
      .catch((error) => {
        console.error(error);
      })
  }, [window.location.href])

  useEffect(() => {
    const progressBarObserver = new MutationObserver((mutations, obs) => {
      const progressBar =
        document.querySelector(".ytp-progress-bar");
      const progressBarBackground = progressBar.firstChild.firstChild.childNodes[1].firstChild;
      const progressBarScroller =
        document.querySelector(".ytp-scrubber-button");

      if (progressBar && progressBarBackground && progressBarScroller) {
        progressBar.style.height = "20px";
        progressBarScroller.style.width = "4px";
        progressBarScroller.style.background = "black";

        if (utterancesRef.current) {
          let gradient = "linear-gradient(90deg, "
          let currentPercentage = 0;
          utterancesRef.current.filter((item) => item.start <= currentVideoTimeRef.current)
            .forEach((item, index) => {
              const length = item.end - item.start;
              const percentage = (length / currentVideoTimeRef.current) * 100;
              if (index === 0) {
                currentPercentage = Math.min(currentPercentage + percentage, 100);
                gradient = gradient + `${labelToColor[item.label]} ${currentPercentage}%, `;
              } else {
                gradient = gradient + `${labelToColor[item.label]} ${currentPercentage}%, `;
                currentPercentage = Math.min(currentPercentage + percentage, 100);
                gradient = gradient + `${labelToColor[item.label]} ${currentPercentage}%, `;
              }
            })
          gradient = gradient.substring(0, gradient.length - 2) + ")"
          progressBarBackground.style.background = gradient;
        }
      }
    });

    progressBarObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }, []);

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

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  }

  return (
    <div style={styles.container}>
      <h1>AI Utterance Analysis</h1>

      {/* <p>Current Video Time: {currentVideoTime} seconds</p> */}
      {utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .slice(-1)
        .map((utterance) => (
          <div key={utterance.start} style={styles.utterance}>
            <p style={styles.time}>{formatTime(utterance.start)}</p>
            <h2>"{utterance.text}"</h2>
          </div>
        ))}

      {/* place holders below */}
      <h2>Current Labels:</h2>
      <div style={styles.labels}>
        {utterances
          .filter((utterance) => utterance.start <= currentVideoTime)
          .slice(-1)
          .map((utterance) => (
            <p style={styles.label}>{utterance.label}</p>
          ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={utterances
            .filter((utterance) => utterance.start <= currentVideoTime)
            .map((utterance) => utterance.label)
            .filter((label, index, self) => self.indexOf(label) === index)
            .map((label) => ({
              name: label,
              value: utterances
                .filter((utterance) => utterance.start <= currentVideoTime)
                .filter((utterance) => utterance.label === label).length,
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