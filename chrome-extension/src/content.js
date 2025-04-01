import config from "./config";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { IconButton, Stack, Collapse } from "@mui/material";
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
  const [textColor, setTextColor] = useState("#000"); // fallback color
  const [currentChip, setCurrentChip] = useState();
  const utterancesRef = useRef();
  const currentVideoTimeRef = useRef();
  const hoveredBarRef = useRef();
  const viewComponentRef = useRef();
  const textColorRef = useRef();
  const currentChipRef = useRef();

  const labelToColor = {
    "Procedural Act": "#FF69B4",
    Question: "#007BFF",
    "Gratitude/Congratulations": "#800080",
    "Self Claim": "#DC143C",
    "Unattributed Claim": "#FFD700",
    "Attributed Claim": "#008B8B",
    "Accusatory Claim": "#8B0000",
    "Position Taking": "#FF8C00",
    Miscellaneous: "#D3D3D3",
    "Promise/Commitment": "#228B22",
  };

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
  }, [viewComponent]);

  useEffect(() => {
    utterancesRef.current = utterances;
  }, [utterances]);

  useEffect(() => {
    currentVideoTimeRef.current = currentVideoTime;
  }, [currentVideoTime]);

  useEffect(() => {
    hoveredBarRef.current = hoveredBar;
  }, [hoveredBar]);

  useEffect(() => {
    viewComponentRef.current = viewComponent;
  }, [viewComponent]);

  useEffect(() => {
    textColorRef.current = textColor;
  }, [textColor]);

  useEffect(() => {
    currentChipRef.current = currentChip;
  }, [currentChip]);

  const addChip = () => {
    if (currentChipRef.current) {
      currentChipRef.current.remove();
    }

    const chipContainer =
      recommendationBar.childNodes[3].childNodes[5].firstChild.childNodes[3]
        .firstChild.childNodes[3].childNodes[3].childNodes[1];
    const chip = chipContainer.childNodes[2];
    const ourChip = chip.cloneNode(true);
    ourChip.childNodes[5].childNodes[3].remove();
    ourChip.childNodes[5].appendChild(
      document.createTextNode("Utterance Analysis")
    );
    ourChip.addEventListener("click", function () {
      setViewComponent(true);
    });
    ourChip.style.border = "double 2px transparent";
    ourChip.style.borderRadius = "10px";

    ourChip.style.backgroundImage = `linear-gradient(${textColorRef.current === "rgb(15, 15, 15)" ? "#FFF" : "#171717"
      }, ${textColorRef.current === "rgb(15, 15, 15)" ? "#FFF" : "#171717"
      }), linear-gradient(to right, #f03 80%, #ff2791 100%)`;
    ourChip.style.backgroundOrigin = "border-box";
    ourChip.style.backgroundClip = "content-box, border-box";
    if (textColorRef.current === "rgb(15, 15, 15)") {
      ourChip.childNodes[5].style.backgroundColor = "black";
      ourChip.childNodes[5].style.color = "white";
    } else {
      ourChip.childNodes[5].style.backgroundColor = "white";
      ourChip.childNodes[5].style.color = "black";
    }
    chipContainer.insertBefore(ourChip, chipContainer.childNodes[1]);

    setCurrentChip(ourChip);
  };

  useEffect(() => {
    const chipObserver = new MutationObserver((mutations, obs) => {
      addChip();
      obs.disconnect();
    });

    chipObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }, [textColor]);

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
    setUtterances([]);
    setSpeakers([
      { title: "Speaker A", nickname: "Nickname A" },
      { title: "Speaker B", nickname: "Nickname B" },
      { title: "Speaker C", nickname: "Nickname C" },
    ]);
    chrome.runtime.sendMessage({ action: "getYouTubeCookies" }, (response) => {
      if (viewComponent && response?.cookies) {
        axios
          .post(`${config.BACKEND_URL}/process_transcript`, {
            url: window.location.href,
            cookies: response.cookies,
          })
          .then((data) => {
            const utterances = data.data.utterances.sort(
              (a, b) => a.start - b.start
            );
            setUtterances(utterances);
            const speakers = data.data.speakers.map((speaker, index) => {
              return {
                title: speaker,
                nickname: "Speaker " + (index + 1),
              };
            });
            setSpeakers(speakers);
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        console.error("No cookies found.");
      }
    });
  }, [window.location.href, viewComponent]);

  const updateProgressBar = () => {
    const progressBar = document.querySelector(".ytp-progress-bar");
    const progressBarBackground =
      progressBar.firstChild.firstChild.childNodes[1].firstChild;
    const progressBarScroller = document.querySelector(".ytp-scrubber-button");

    if (progressBar && progressBarBackground && progressBarScroller) {
      if (viewComponentRef.current === true) {
        progressBar.style.height = "20px";
        progressBarScroller.style.width = "4px";
        progressBarScroller.style.background = "black";

        if (utterancesRef.current) {
          let gradient = "linear-gradient(90deg, ";
          let currentPercentage = 0;
          utterancesRef.current
            .filter((item) => item.start <= currentVideoTimeRef.current)
            .forEach((item, index) => {
              const length = item.end - item.start;
              const percentage = (length / currentVideoTimeRef.current) * 100;
              let color = labelToColor[item.label];
              if (
                hoveredBarRef?.current &&
                hoveredBarRef.current !== item.label
              ) {
                color = "gray";
              }

              if (index === 0) {
                currentPercentage = Math.min(
                  currentPercentage + percentage,
                  100
                );
                gradient = gradient + `${color} ${currentPercentage}%, `;
              } else {
                gradient = gradient + `${color} ${currentPercentage}%, `;
                currentPercentage = Math.min(
                  currentPercentage + percentage,
                  100
                );
                gradient = gradient + `${color} ${currentPercentage}%, `;
              }
            });
          gradient = gradient.substring(0, gradient.length - 2) + ")";
          progressBarBackground.style.background = gradient;
        }
      } else {
        progressBar.style.height = "100%";
        progressBarScroller.style.width = "13px";
        progressBarScroller.style.background =
          "var(--yt-spec-static-brand-red,#f03)";
        progressBarBackground.style.background =
          "linear-gradient(to right,#f03 80%,#ff2791 100%)";
      }
    }
  };

  useEffect(() => {
    updateProgressBar();
  }, [hoveredBar]);

  useEffect(() => {
    const progressBarObserver = new MutationObserver((mutations, obs) => {
      updateProgressBar();
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
      backgroundColor: "#263850",
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
    speakerSelect: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
    },
    speaker: {
      minWidth: "1rem",
      background: "rgba(255,255,255,0.2)",
      color: "#FFF",
      borderRadius: "4px",
      padding: "0.5rem",
    },
    barInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    } else {
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
  };

  function setProgressBarVisibility(visible) {
    const css = visible
      ? `
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
  `
      : `
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
    const existingStyle = document.getElementById("progress-bar-toggle-style");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new style
    if (visible) {
      const style = document.createElement("style");
      style.id = "progress-bar-toggle-style";
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  const [speakers, setSpeakers] = useState([
    { title: "Speaker A", nickname: "Nickname A" },
    { title: "Speaker B", nickname: "Nickname B" },
    { title: "Speaker C", nickname: "Nickname C" },
  ]);

  const handleUpdateNickname = (event, index) => {
    const newSpeakers = [...speakers];
    newSpeakers[index].nickname = event.target.value;
    setSpeakers(newSpeakers);
  };

  const [speaker1, setSpeaker1] = useState("2");

  const handleChangeSpeaker1 = (event) => {
    setSpeaker1(event.target.value);
  };
  const [speaker2, setSpeaker2] = useState("1");

  const handleChangeSpeaker2 = (event) => {
    setSpeaker2(event.target.value);
  };

  const [collapse, setCollapse] = useState(true);

  const [barInfo, setBarInfo] = useState("");
  const handleBarClick = (data) => {
    setBarInfo(
      <div style={styles.barInfo}>
        <h2>{data.name}</h2>
        <h3>
          {speakers.find((s) => String(s.title) === String(speaker1))
            ?.nickname || "All Speakers"}
        </h3>
        <div style={styles.labels}>
          {data.speaker1Times.map((time, i) => {
            const utteranceText =
              utterances.find(
                (u) => {
                  return u.start === time &&
                    u.label === data.name &&
                    String(u.speaker) === String(speaker1)
                }

              )?.text || "";

            return (
              <button
                key={`speaker1-${i}`}
                style={{
                  ...styles.time,
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                }}
                title={utteranceText}
                onClick={() => {
                  const video = document.querySelector("video");
                  if (video) {
                    video.currentTime = time / 1000;
                    video.play();
                  }
                }}
              >
                {formatTime(time)}
              </button>
            );
          })}
        </div>
        <h3>
          {speakers.find((s) => String(s.title) === String(speaker2))
            ?.nickname || "All Speakers"}
        </h3>
        <div style={styles.labels}>
          {data.speaker2Times.map((time, i) => {
            const utteranceText =
              utterances.find(
                (u) =>
                  u.start === time &&
                  u.label === data.name &&
                  String(u.speaker) === String(speaker2)
              )?.text || "";

            return (
              <button
                key={`speaker2-${i}`}
                style={{
                  ...styles.time,
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                }}
                title={utteranceText}
                onClick={() => {
                  const video = document.querySelector("video");
                  if (video) {
                    video.currentTime = time / 1000;
                    video.play();
                  }
                }}
              >
                {formatTime(time)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const chartData = utterances
    .filter((utterance) => utterance.start <= currentVideoTime)
    .map((utterance) => utterance.label)
    .filter((label, index, self) => self.indexOf(label) === index)
    .map((label) => ({
      name: label,
      speaker1:
        utterances
          .filter((utterance) => utterance.start <= currentVideoTime)
          .filter((utterance) =>
            speaker1 === "Everyone"
              ? true
              : String(utterance.speaker) === String(speaker1)
          )
          .filter((utterance) => utterance.label === label).length * -1,
      speaker2: utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .filter((utterance) =>
          speaker2 === "Everyone"
            ? true
            : String(utterance.speaker) === String(speaker2)
        )
        .filter((utterance) => utterance.label === label).length,
      speaker1Times: utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .filter((utterance) =>
          speaker1 === "Everyone"
            ? true
            : String(utterance.speaker) === String(speaker1)
        )
        .filter((utterance) => utterance.label === label)
        .map((utterance) => utterance.start),
      speaker2Times: utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .filter((utterance) =>
          speaker2 === "Everyone"
            ? true
            : String(utterance.speaker) === String(speaker2)
        )
        .filter((utterance) => utterance.label === label)
        .map((utterance) => utterance.start),
    }))
    .sort((a, b) => a.speaker1 - b.speaker1);

  const darkenHexColor = (hex, factor = 0.8) => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.floor(r * factor));
    g = Math.max(0, Math.floor(g * factor));
    b = Math.max(0, Math.floor(b * factor));

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  return (
    <div style={styles.container}>
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <h1>AI Utterance Analysis</h1>
        <IconButton
          sx={{
            mt: -1.5,
            mr: -2,
            padding: 1,
            "&:hover": {
              backgroundColor:
                textColor === "rgb(15, 15, 15)"
                  ? "rgba(0, 0, 0, 0.1)"
                  : "rgba(255, 255, 255, 0.15)",
            },
          }}
          size="large"
          onClick={() => {
            setViewComponent(false);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            height="24"
            width="24"
            focusable="false"
            aria-hidden="true"
            style={{
              pointerEvents: "none",
              display: "inherit",
              width: "100%",
              height: "100%",
              stroke: textColor === "rgb(15, 15, 15)" ? "#a2a2a2" : "#868686",
              fill: textColor === "rgb(15, 15, 15)" ? "#0f0f0f" : "#f1f1f1",
            }}
          >
            <path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path>
          </svg>
        </IconButton>
      </Stack>

      {/* <p>Current Video Time: {currentVideoTime} seconds</p> */}
      {utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .slice(-1)
        .map((utterance) => (
          <Collapse in={collapse} collapsedSize={50}>
            <div
              key={utterance.start}
              style={styles.utterance}
              onClick={() => setCollapse(!collapse)}
            >
              <p style={styles.time}>{formatTime(utterance.start)}</p>
              <h2>"{utterance.text}"</h2>
            </div>
          </Collapse>
        ))}

      {/* place holders below */}
      <h2>Current Labels:</h2>
      <Stack direction="row" spacing={1}>
        <div style={styles.labels}>
          {utterances
            .filter((utterance) => utterance.start <= currentVideoTime)
            .slice(-1)
            .map((utterance) => (
              <p style={styles.label}>{utterance.label}</p>
            ))}
        </div>
        <div style={styles.labels}>
          {utterances
            .filter((utterance) => utterance.start <= currentVideoTime)
            .slice(-1)
            .map((utterance) => {
              let sentimentColor = "grey";
              if (utterance.sentiment === "positive") {
                sentimentColor = "green";
              } else if (utterance.sentiment === "negative") {
                sentimentColor = "red";
              }

              const sentiment =
                utterance.sentiment.charAt(0).toUpperCase() +
                utterance.sentiment.slice(1);

              return (
                <p style={{ ...styles.label, backgroundColor: sentimentColor }}>
                  {sentiment}
                </p>
              );
            })}
        </div>
      </Stack>

      <h2>Speakers:</h2>
      <div style={styles.labels}>
        {speakers.map((speaker, index) => (
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <input
              style={{
                ...styles.speaker,
                width: `${(speaker.nickname?.length || 1) + 1}ch`,
                border:
                  utterances
                    .filter((utterance) => utterance.start <= currentVideoTime)
                    .slice(-1)[0]?.speaker === speaker.title
                    ? "2px solid #ffffff"
                    : "none",
                paddingRight: "1.5rem", // make room for ornament
              }}
              type="text"
              key={speaker.title}
              value={speaker.nickname}
              onChange={(event) => handleUpdateNickname(event, index)}
            />
            {speaker.title ===
              utterances
                .filter((utterance) => utterance.start <= currentVideoTime)
                .slice(-1)[0]?.speaker && (
                <span
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    color: "#fff",
                    pointerEvents: "none",
                  }}
                >
                  🔊
                </span>
              )}
          </div>
        ))}
      </div>

      <div style={styles.speakerSelect}>
        <select
          value={speaker1}
          label="speaker"
          onChange={handleChangeSpeaker1}
        >
          <option value={"Everyone"}>All Speakers</option>
          {speakers.map((speaker) => (
            <option key={speaker.title} value={speaker.title}>
              {speaker.nickname}
            </option>
          ))}
        </select>
        <select
          value={speaker2}
          label="speaker"
          onChange={handleChangeSpeaker2}
        >
          <option value={"Everyone"}>All Speakers</option>
          {speakers.map((speaker) => (
            <option key={speaker.title} value={speaker.title}>
              {speaker.nickname}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          width={500}
          height={300}
          data={chartData}
          stackOffset="sign"
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => Math.abs(value)} />
          <YAxis dataKey="name" type="category" tickFormatter={(name) => name.replace(/\//g, '/ ')} />
          {/* <Tooltip />
          <Legend /> */}
          <ReferenceLine x={0} stroke="#000" />
          <Bar
            dataKey="speaker1"
            stackId="stack"
            onClick={handleBarClick}
            onMouseEnter={(e) => {
              setHoveredBar(e.name);
              setProgressBarVisibility(true);
            }}
            onMouseLeave={() => {
              setHoveredBar(null);
              setProgressBarVisibility(false);
            }}
          >
            {chartData.map((entry, index) => {
              return (
                <Cell key={`cell-${index}`} fill={labelToColor[entry.name]} />
              );
            })}
          </Bar>
          <Bar
            dataKey="speaker2"
            stackId="stack"
            onClick={handleBarClick}
            onMouseEnter={(e) => {
              setHoveredBar(e.name);
              setProgressBarVisibility(true);
            }}
            onMouseLeave={() => {
              setHoveredBar(null);
              setProgressBarVisibility(false);
            }}
          >
            {chartData.map((entry, index) => {
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={darkenHexColor(labelToColor[entry.name])}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {barInfo}
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
    root.render(
      <CustomComponent
        recommendationBar={recommendationBar}
        container={container}
      />
    );

    obs.disconnect();
  }
});

recommendationObserver.observe(document.body, {
  childList: true,
  subtree: true,
});
