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
import { IconButton, Stack, Button } from "@mui/material";
import axios from "axios";

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

const CustomComponent = (props) => {
  const { recommendationBar, container } = props;
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [utterances, setUtterances] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [viewComponent, setViewComponent] = useState(false);
  const utterancesRef = useRef();
  const currentVideoTimeRef = useRef();
  const hoveredBarRef = useRef();
  const viewComponentRef = useRef();
  const [textColor, setTextColor] = useState("#000"); // fallback color
  const [currentChip, setCurrentChip] = useState();


  const labelToColor = {
    "Self Claims - Political Track Record": "red",
    "General Claim Statistical": "blue",
    "Communicative Metareference": "green",
    "Gratitude/Congratulations": "purple",
    "General Claim Non-statistical": "yellow",
  }

  useEffect(() => {
    if (viewComponent) {
      Array.from(recommendationBar.children).forEach((child) => {
        child.style.display = "none";
      });
      container.style.display = "initial";
    } else {
      Array.from(recommendationBar.children).forEach((child) => {
        child.style.display = "initial";
      });
      container.style.display = "none";
    }
  }, [viewComponent])

  useEffect(() => {
    utterancesRef.current = utterances
  }, [utterances])

  useEffect(() => {
    currentVideoTimeRef.current = currentVideoTime
  }, [currentVideoTime])

  useEffect(() => {
    hoveredBarRef.current = hoveredBar
  }, [hoveredBar])

  useEffect(() => {
    viewComponentRef.current = viewComponent
  }, [viewComponent])

  useEffect(() => {
    if (currentChip) {
      currentChip.remove();
    }

    const chipContainer = recommendationBar.childNodes[3].childNodes[5].firstChild.childNodes[3].firstChild.childNodes[3].childNodes[3].childNodes[1]
    const chip = chipContainer.childNodes[2]
    const ourChip = chip.cloneNode(true);
    ourChip.childNodes[5].childNodes[3].remove()
    ourChip.childNodes[5].appendChild(document.createTextNode('Utterance Analysis'))
    ourChip.addEventListener('click', function () {
      setViewComponent(true);
    });
    ourChip.style.border = 'double 2px transparent';
    ourChip.style.borderRadius = '10px';
    ourChip.style.backgroundImage = `linear-gradient(${textColor === "rgb(15, 15, 15)" ? "#FFF" : "#171717"}, ${textColor === "rgb(15, 15, 15)" ? "#FFF" : "#171717"}), linear-gradient(to right, #f03 80%, #ff2791 100%)`;
    ourChip.style.backgroundOrigin = 'border-box';
    ourChip.style.backgroundClip = 'content-box, border-box';
    if (textColor === "rgb(15, 15, 15)") {
      ourChip.childNodes[5].style.backgroundColor = "black";
      ourChip.childNodes[5].style.color = "white";
    } else {
      ourChip.childNodes[5].style.backgroundColor = "white";
      ourChip.childNodes[5].style.color = "black";
    }
    chipContainer.insertBefore(ourChip, chipContainer.childNodes[1])

    setCurrentChip(ourChip);
  }, [textColor])

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
    if (viewComponent) {
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
    }
  }, [window.location.href, viewComponent])

  const updateProgressBar = () => {
    const progressBar =
      document.querySelector(".ytp-progress-bar");
    const progressBarBackground = progressBar.firstChild.firstChild.childNodes[1].firstChild;
    const progressBarScroller =
      document.querySelector(".ytp-scrubber-button");

    if (progressBar && progressBarBackground && progressBarScroller) {
      if (viewComponentRef.current === true) {
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
              let color = labelToColor[item.label]
              if (hoveredBarRef?.current && hoveredBarRef.current !== item.label) {
                color = "gray"
              }

              if (index === 0) {
                currentPercentage = Math.min(currentPercentage + percentage, 100);
                gradient = gradient + `${color} ${currentPercentage}%, `;
              } else {
                gradient = gradient + `${color} ${currentPercentage}%, `;
                currentPercentage = Math.min(currentPercentage + percentage, 100);
                gradient = gradient + `${color} ${currentPercentage}%, `;
              }
            })
          gradient = gradient.substring(0, gradient.length - 2) + ")"
          progressBarBackground.style.background = gradient;
        }
      } else {
        progressBar.style.height = "100%";
        progressBarScroller.style.width = "13px";
        progressBarScroller.style.background = "var(--yt-spec-static-brand-red,#f03)";
        progressBarBackground.style.background = "linear-gradient(to right,#f03 80%,#ff2791 100%)";
      }

    }
  }

  useEffect(() => {
    updateProgressBar()
  }, [hoveredBar])

  useEffect(() => {
    const progressBarObserver = new MutationObserver((mutations, obs) => {
      updateProgressBar()
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

  function setProgressBarVisibility(visible) {
    const css = visible ? `
    .ytp-progress-bar-container,
    .ytp-chrome-bottom {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .ytp-autohide .ytp-progress-bar-container,
    .ytp-autohide .ytp-chrome-bottom {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .ytp-gradient-bottom {
      opacity: 1 !important;
      visibility: visible !important;
      display: initial !important;
    }
  ` : `
    /* Restore default YouTube behavior */
    .ytp-progress-bar-container {
      opacity: 0 !important;
      transition: opacity .1s cubic-bezier(0.4,0,1,1) !important;
    }
    .ytp-autohide .ytp-progress-bar-container {
      opacity: 0 !important;
    }
    .ytp-gradient-bottom {
      opacity: 0 !important;
      visibility: hidden !important;
      display: none !important;
    }
  `;

    // Remove existing style if it exists
    const existingStyle = document.getElementById('progress-bar-toggle-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new style
    if (visible) {
      const style = document.createElement('style');
      style.id = 'progress-bar-toggle-style';
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  return (
    <div style={styles.container}>
      <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
        <h1>AI Utterance Analysis</h1>
        <IconButton sx={{
          mt: -1.5, mr: -2, padding: 1, '&:hover': {
            backgroundColor: textColor === "rgb(15, 15, 15)" ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)',
          }
        }} size="large" onClick={() => {
          setViewComponent(false)
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24" width="24" focusable="false" aria-hidden="true" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', stroke: textColor === "rgb(15, 15, 15)" ? "#a2a2a2" : "#868686", fill: textColor === "rgb(15, 15, 15)" ? "#0f0f0f" : "#f1f1f1" }}>
            <path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path>
          </svg>
        </IconButton >
      </Stack>

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
          <Bar dataKey="value" fill="#3ea6ff" onMouseEnter={(e) => {
            setHoveredBar(e.name)
            setProgressBarVisibility(true);
          }}
            onMouseLeave={() => {
              setHoveredBar(null);
              setProgressBarVisibility(false);
            }} />
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

    const container = document.createElement("div");
    recommendationBar.appendChild(container);

    const root = createRoot(container);
    root.render(<CustomComponent recommendationBar={recommendationBar} container={container} />);

    obs.disconnect();
  }
});

recommendationObserver.observe(document.body, {
  childList: true,
  subtree: true,
});