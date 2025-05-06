import config from "./config";
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Tooltip,
} from "recharts";
import {
  IconButton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Grid,
  Box,
  Autocomplete,
  TextField,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Popover,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { CustomTimeDisplay } from "./CustomTimeDisplay";
import PieChartIcon from "@mui/icons-material/PieChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import { CustomPieBoth } from "./CustomPieBoth";
import {
  VideoLibrary,
  SmartDisplay,
  SentimentVerySatisfied,
  Label,
  Settings,
} from "@mui/icons-material";
import { SettingsPage } from "./SettingsPage";
import { LabelVoting } from "./LabelVoting";

const initialDialogicActs = {
  Interpersonal: {
    definition: "",
    labels: [
      {
        label: "Denial/Disagreement",
        definition:
          "Direct or implied rejection of a prior claim or characterization.",
        selected: true,
      },
      {
        label: "Confirmation/Acknowledgement",
        definition:
          "Affirmation or acknowledgment of another speaker's statement.",
        selected: true,
      },
      {
        label: "Gratitude/Congratulations",
        definition: "Expressions of thanks, praise, or goodwill.",
        selected: true,
      },
    ],
    color: "#FF69B4",
  },
  "Debate Mechanics": {
    definition: "",
    labels: [
      {
        label: "Communicative Metareference",
        definition: "Comments on debate format, structure, or speaking order.",
        selected: true,
      },
      {
        label: "Question",
        definition:
          "Requests for info, clarification, or accountability (often ends with '?').",
        selected: true,
      },
      {
        label: "Directive",
        definition:
          "Commands or instructions to the audience, opponent, or moderator.",
        selected: true,
      },
    ],
    color: "#007BFF",
  },
  Informing: {
    definition: "",
    labels: [
      {
        label: "Factual Claim",
        definition: "Objective, testable statement about the world.",
        selected: true,
      },
      {
        label: "Statistical Claim",
        definition: "Numerically grounded or quantified assertion.",
        selected: true,
      },
    ],
    color: "#228B22",
  },
  "Self Representation": {
    definition: "",
    labels: [
      {
        label: "Self Track Record",
        definition: "Claim about speaker's past leadership or achievements.",
        selected: true,
      },
      {
        label: "Personal Testimony",
        definition: "Statements about personal life or lived experience.",
        selected: true,
      },
      {
        label: "Policy Position",
        definition: "Stance or proposal on a political issue or legislation.",
        selected: true,
      },
      {
        label: "Commitment",
        definition: "Pledge or promise to take a future action.",
        selected: true,
      },
    ],
    color: "#FF8C00",
  },
  Accusation: {
    definition: "",
    labels: [
      {
        label: "Accu Policies and Beliefs",
        definition:
          "Assertions about an opponent's political views or stances.",
        selected: true,
      },
      {
        label: "Accu Track Record",
        definition:
          "Critiques of opponent''s past political or professional actions.",
        selected: true,
      },
      {
        label: "Accu Personal Life",
        definition: "Claims about an opponent's family, finances, or conduct.",
        selected: true,
      },
      {
        label: "Accu Other Entities",
        definition:
          "Criticism of non-candidates like media, corporations, or governments.",
        selected: true,
      },
    ],
    color: "#FFD700",
  },
  Quoting: {
    definition: "",
    labels: [
      {
        label: "Attributed Quote",
        definition:
          "Statement cited to a named person, group, or organization.",
        selected: true,
      },
      {
        label: "Unattributed Quote",
        definition: "Quote from anonymous or vague sources like 'people say'.",
        selected: true,
      },
      {
        label: "Self Quote",
        definition: "Speaker quoting their own past remarks or campaign.",
        selected: true,
      },
      {
        label: "Opponent Quote",
        definition:
          "Quoting the opponent or their campaign directly or indirectly.",
        selected: true,
      },
    ],
    color: "#008B8B",
  },
  Other: {
    definition: "",
    labels: [
      {
        label: "Subjective Statement",
        definition:
          "Evaluative or emotional characterization of events or people.",
        selected: true,
      },
      {
        label: "Miscellaneous",
        definition:
          "Unclassifiable speech such as interruptions or incomplete phrases.",
        selected: true,
      },
    ],
    color: "#808080",
  },
  Sentiment: {
    definition: "",
    labels: [
      {
        label: "neutral",
        definition: "",
        selected: true,
      },
      {
        label: "positive",
        definition: "",
        selected: true,
      },
      {
        label: "negative",
        definition: "",
        selected: true,
      },
    ],
    color: "#A9A9A9",
  },
};

function flattenDialogicActs(data, includeCategory = false) {
  const result = [];

  for (const [category, categoryData] of Object.entries(data)) {
    for (const labelObj of categoryData.labels) {
      const flattenedLabel = includeCategory
        ? { ...labelObj, category }
        : { ...labelObj };

      result.push(flattenedLabel);
    }
  }

  return result;
}

function getLabelDefinition(labelName) {
  for (const categoryData of Object.values(initialDialogicActs)) {
    for (const labelObj of categoryData.labels) {
      if (labelObj.label === labelName) {
        return labelObj.definition;
      }
    }
  }
  return null;
}

function getLabelCategoryColor(labelName) {
  if (labelName === "negative") {
    return "#C70039";
  } else if (labelName === "positive") {
    return "#008000";
  } else if (labelName === "neutral") {
    return "#808080";
  }

  for (const [categoryName, categoryData] of Object.entries(
    initialDialogicActs
  )) {
    for (const labelObj of categoryData.labels) {
      if (labelObj.label === labelName) {
        return categoryData.color;
      }
    }
  }
  return null;
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

const LibraryAnalysis = ({ speakers }) => {
  const [videosWithSpeaker, setVideosWithSpeaker] = useState({
    overallLabel: {},
    overallSentiment: {},
    videos: [],
  });
  const [displaySentiment, setDisplaySentiment] = useState(false);
  const [flippedVideos, setFlippedVideos] = useState([]);

  const getStatsForSpeaker = (speaker) => {
    axios
      .post(`${config.BACKEND_URL}/get_all_videos_for_speaker`, {
        speaker: speaker,
      })
      .then((data) => {
        setVideosWithSpeaker(data.data);
        setFlippedVideos(Array(data.data.length).fill(false));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const getCategoryOfLabel = (label) => {
    for (const category in initialDialogicActs) {
      const labels = initialDialogicActs[category].labels;
      for (const labelObj of labels) {
        if (labelObj.label === label) {
          return category;
        }
      }
    }
    return null;
  };

  const VideoItem = ({ video, displaySentiment, flipped, setFlipped }) => {
    const chartDataLabel = useMemo(() => {
      const categoryData = {};
      Object.entries(video.overallLabel).forEach(([key, value]) => {
        const category = getCategoryOfLabel(key);
        if (categoryData[category]) {
          categoryData[category] = categoryData[category] + value;
        } else {
          categoryData[category] = value;
        }
      });

      return Object.entries(categoryData).map(([key, value]) => ({
        name: key,
        value: value,
        text: initialDialogicActs[key].definition,
        color: initialDialogicActs[key].color,
      }));
    }, [video]);

    const chartDataSentiment = useMemo(() => {
      return Object.entries(video.overallSentiment).map(([key, value]) => ({
        name: key,
        value: value,
        text: getLabelDefinition(key),
        color: getLabelCategoryColor(key),
      }));
    }, [video]);

    const selectedChartData = displaySentiment
      ? chartDataSentiment
      : chartDataLabel;

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const label = payload[0].payload.name;
        const definition = getLabelDefinition(label);

        return (
          <div
            style={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #555",
              padding: "10px",
              borderRadius: "8px",
              marginLeft: "-60px",
              maxWidth: "130px",
              fontSize: "0.9rem",
              color: "#f1f1f1",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <strong style={{ color: "#fff", fontSize: "1rem" }}>{label}</strong>
            <p style={{ marginTop: "4px", lineHeight: "1.4" }}>{definition}</p>
          </div>
        );
      }

      return null;
    };

    return (
      <Grid size={6}>
        <Card
          sx={{
            height: 200,
            perspective: "1000px",
            backgroundColor: "rgb(33, 33, 33)",
            color: "white",
            border: "1px solid gray",
          }}
        >
          <CardActionArea
            onClick={() => setFlipped(!flipped)}
            sx={{
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform 2s",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <CardMedia
              sx={{
                height: 100,
                backgroundColor: "grey",
                marginTop: video.thumbnail !== "" ? undefined : "-47px",
                backfaceVisibility: "hidden",
              }}
              src={video.thumbnail !== "" ? video.thumbnail : undefined}
              component="img"
            />
            <CardContent
              sx={{ padding: 0, px: "4px", backfaceVisibility: "hidden" }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{ maxHeight: 40, overflow: "hidden" }}
              >
                {video.title}
              </Typography>
              <Typography gutterBottom variant="subtitle1" component="div">
                {video.date}
              </Typography>

              <Typography variant="body2" sx={{ color: "gray" }}>
                {video.description}
              </Typography>
            </CardContent>
            <CardContent
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                padding: 0,
              }}
            >
              {selectedChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    layout="vertical"
                    data={selectedChartData}
                    animationDuration={0}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickFormatter={(name) => name.replace(/\//g, "/ ")}
                      tick={{ fontSize: 10 }}
                      angle={displaySentiment ? undefined : -30}
                      textAnchor="end"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="value" isAnimationActive={false}>
                      {selectedChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const label = payload[0].payload.name;
      const definition = getLabelDefinition(label);

      return (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            border: "1px solid #555",
            padding: "10px",
            borderRadius: "8px",
            maxWidth: "250px",
            fontSize: "0.9rem",
            color: "#f1f1f1",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <strong style={{ color: "#fff", fontSize: "1rem" }}>{label}</strong>
          <p style={{ marginTop: "4px", lineHeight: "1.4" }}>{definition}</p>
        </div>
      );
    }

    return null;
  };

  const chartDataLabel = useMemo(() => {
    return Object.entries(videosWithSpeaker.overallLabel).map(
      ([key, value]) => ({
        name: key,
        value: value,
        text: getLabelDefinition(key),
        color: getLabelCategoryColor(key),
      })
    );
  }, [videosWithSpeaker]);

  const chartDataSentiment = useMemo(() => {
    return Object.entries(videosWithSpeaker.overallSentiment).map(
      ([key, value]) => ({
        name: key,
        value: value,
        text: getLabelDefinition(key),
        color: getLabelCategoryColor(key),
      })
    );
  }, [videosWithSpeaker]);

  const selectedChartData = displaySentiment
    ? chartDataSentiment
    : chartDataLabel;

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="column" spacing={1}>
        <Stack direction="row" spacing={0.5} justifyContent="space-between">
          <Autocomplete
            options={speakers}
            onChange={(event, value) => {
              getStatsForSpeaker(value);
            }}
            slotProps={{
              inputLabel: {
                color: "gray",
              },
              popper: {
                sx: {
                  "& .MuiAutocomplete-paper": {
                    backgroundColor: "#1e1e1e",
                    color: "#fff",
                  },
                },
              },
            }}
            sx={{
              "& .MuiInputBase-root": {
                color: "white",
                backgroundColor: "#1e1e1e",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "gray",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "white",
              },
              "& .MuiInputLabel-root": {
                color: "gray",
              },
              width: "70%",
            }}
            renderInput={(params) => <TextField {...params} label="Speaker" />}
          />
          <ToggleButtonGroup
            value={displaySentiment}
            exclusive
            onChange={(event, value) => {
              setDisplaySentiment(value);
            }}
            aria-label="single or multiple video analysis"
            sx={{
              backgroundColor: "#ffffff33",
              "& .MuiToggleButton-root": {
                color: "white",
                border: "none",
                "&:hover": {
                  backgroundColor: "#ffffff44",
                },
              },
              "& .MuiToggleButton-root.Mui-selected": {
                backgroundColor: "#ffffff66",
                color: "white",
                "&:hover": {
                  backgroundColor: "#ffffff88",
                },
              },
            }}
          >
            <ToggleButton value={false} aria-label="label">
              <Label />
            </ToggleButton>
            <ToggleButton value={true} aria-label="sentiment">
              <SentimentVerySatisfied />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {selectedChartData.length > 0 && (
          <>
            <h2>Overall Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={selectedChartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickFormatter={(name) => name.replace(/\//g, "/ ")}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="value">
                  {selectedChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <CustomPieBoth
              data1={chartDataLabel}
              data2={chartDataSentiment}
              width={"100%"}
              height={300}
            />
            <h2>Per-Video Trends</h2>
            <Grid container spacing={2}>
              {videosWithSpeaker.videos.map((video, index) => (
                <VideoItem
                  key={video.title}
                  video={video}
                  displaySentiment={displaySentiment}
                  flipped={flippedVideos[index]}
                  setFlipped={() => {
                    flippedVideos[index] = !flippedVideos[index];
                    setFlippedVideos([...flippedVideos]);
                  }}
                />
              ))}
            </Grid>
          </>
        )}
      </Stack>
    </Box>
  );
};

const CustomComponent = (props) => {
  const { recommendationBar, container } = props;
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [utterances, setUtterances] = useState([]);
  const [utteranceVotes, setUtteranceVotes] = useState({});
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
  const [newDialogicActs, setNewDialogicActs] = useState(initialDialogicActs);

  const atDemoURL = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v") === config.DEMO_URL;
  }, [window.location.search]);

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
    if (textColor !== "#000") {
      addChip();
    }
    const intervalId = setInterval(() => {
      if (textColorRef.current !== "#000") {
        clearInterval(intervalId);
        return;
      }

      if (recommendationBar.childNodes[3]?.childNodes[5]?.firstChild !== null) {
        addChip();
        clearInterval(intervalId);
      }
    }, 500);
  }, [textColor]);

  useEffect(() => {
    const handleResize = () => {
      if (currentChipRef.current) {
        while (currentChipRef.current.childNodes[5].firstChild) {
          currentChipRef.current.childNodes[5].removeChild(
            currentChipRef.current.childNodes[5].firstChild
          );
        }
        currentChipRef.current.childNodes[5].appendChild(
          document.createTextNode("Utterance Analysis")
        );
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
    setSpeakers({
      "Speaker A": "Nickname A",
      "Speaker B": "Nickname B",
      "Speaker C": "Nickname C",
    });
    setUtteranceVotes({});
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
            const speakersObject = {};
            data.data.speakers.forEach((speaker, index) => {
              speakersObject[index + 1] = speaker;
            });
            setSpeakers(speakersObject);
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
        progressBar.style.height = "40px";
        progressBarScroller.style.width = "4px";
        progressBarScroller.style.background = "black";
        progressBarBackground.style.background = "transparent";
        if (progressBarBackground.children.length === 0) {
          const gradient1Holder = document.createElement("div");
          gradient1Holder.style.width = "100%";
          gradient1Holder.style.height = "50%";

          const gradient2Holder = document.createElement("div");
          gradient2Holder.style.width = "100%";
          gradient2Holder.style.height = "50%";

          progressBarBackground.appendChild(gradient1Holder);
          progressBarBackground.appendChild(gradient2Holder);
        }

        if (utterancesRef.current) {
          let gradient1 = "linear-gradient(90deg, ";
          let gradient2 = "linear-gradient(90deg, ";
          let currentPercentage = 0;
          utterancesRef.current
            .filter((item) => item.start <= currentVideoTimeRef.current)
            .forEach((item, index) => {
              const stringSpeaker = "" + item.speaker;
              const length = item.end - item.start;
              const percentage = (length / currentVideoTimeRef.current) * 100;
              let color = Object.values(initialDialogicActs).some((group) =>
                group.labels.some(
                  (labelObj) =>
                    labelObj.label === item.labels[0] && labelObj.selected
                )
              )
                ? getLabelCategoryColor(item.labels[0])
                : "transparent";
              if (
                hoveredBarRef?.current &&
                hoveredBarRef.current !== item.labels[0]
              ) {
                color = "black";
              }

              const addToGradient = (
                stringSpeaker,
                potentialColor,
                currentPercentage
              ) => {
                let color1 = "transparent";
                let color2 = "transparent";

                if (
                  stringSpeaker === speaker1Ref.current ||
                  speaker1Ref.current === "Everyone"
                ) {
                  color1 = potentialColor;
                }

                if (
                  stringSpeaker === speaker2Ref.current ||
                  speaker2Ref.current === "Everyone"
                ) {
                  color2 = potentialColor;
                }

                gradient1 = gradient1 + `${color1} ${currentPercentage}%, `;
                gradient2 = gradient2 + `${color2} ${currentPercentage}%, `;
              };

              if (index === 0) {
                currentPercentage = Math.min(
                  currentPercentage + percentage,
                  100
                );
                addToGradient(stringSpeaker, color, currentPercentage);
              } else {
                addToGradient(stringSpeaker, color, currentPercentage);
                currentPercentage = Math.min(
                  currentPercentage + percentage,
                  100
                );
                addToGradient(stringSpeaker, color, currentPercentage);
              }
            });
          gradient1 = gradient1.substring(0, gradient1.length - 2) + ")";
          gradient2 = gradient2.substring(0, gradient2.length - 2) + ")";
          progressBarBackground.childNodes[0].style.background = gradient1;
          progressBarBackground.childNodes[1].style.background = gradient2;
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
      color: "rgb(241, 241, 241)",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "#212121",
      fontFamily: "Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      gap: "1rem",
      maxHeight: "800px",
      overflowY: "auto",
      overflowX: "hidden",
      position: "relative",
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
      cursor: "pointer",
    },
    utterance: { display: "flex", gap: "1rem" },
    labels: {
      display: "flex",
      gap: ".5rem",
      flexWrap: "wrap",
      position: "relative",
      "&:hover .thumb-buttons": {
        display: "flex",
      },
    },
    label: {
      padding: "0.5rem",
      background: "#3ea6ff",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      color: "#FFF",
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
      border: "none",
    },
    barInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      width: "100%",
      position: "relative",
    },
    select: {
      backgroundColor: "#ffffff33",
      color: "white",
      borderRadius: "4px",
      border: "none",
    },
    option: {
      color: "black",
    },
    scrolllist: {
      overflowY: "auto",
      maxHeight: "30rem",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      position: "relative",
    },
    scrollListItem: {
      display: "flex",
      justifyContent: "space-between",
      gap: "1rem",
    },
    scrollListItemContainerLast: {
      backgroundColor: "#ffffff33",
      padding: "1rem .5rem 1rem .5rem",
    },
    scrollListItemContainer: { padding: "1rem .5rem 1rem .5rem" },
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

  const [speakers, setSpeakers] = useState({
    "Speaker A": "Nickname A",
    "Speaker B": "Nickname B",
    "Speaker C": "Nickname C",
  });

  const [autofillSpeakers, setAutofillSpeakers] = useState([]);

  const getAutofillSpeakers = () => {
    axios
      .get(`${config.BACKEND_URL}/autofill_speakers`)
      .then((data) => {
        const filteredSpeakers = data.data
          .map((speaker) => "" + speaker)
          .filter((speaker) => !speaker.includes("Speaker"));
        setAutofillSpeakers(filteredSpeakers);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    getAutofillSpeakers();
  }, []);

  const [analysisPage, setAnalysisPage] = useState("single");

  const handleUpdateNickname = (event, speaker) => {
    setSpeakers((prevSpeakers) => ({
      ...prevSpeakers,
      [speaker]: event.target.value,
    }));
  };

  const [speaker1, setSpeaker1] = useState("Everyone");
  const handleChangeSpeaker1 = (event) => {
    setSpeaker1(event.target.value);
  };
  const speaker1Ref = useRef();
  useEffect(() => {
    speaker1Ref.current = speaker1;
  }, [speaker1]);

  const [speaker2, setSpeaker2] = useState("Everyone");
  const handleChangeSpeaker2 = (event) => {
    setSpeaker2(event.target.value);
  };
  const speaker2Ref = useRef();
  useEffect(() => {
    speaker2Ref.current = speaker2;
  }, [speaker2]);

  const [previousSpeakerName, setPreviousSpeakerName] = useState(null);
  const [editedSpeakers, setEditedSpeakers] = useState({});

  const [barInfo, setBarInfo] = useState("");
  // utterances, speaker1, speaker2, formatTime, setBarInfo, styles, speakers
  const handleBarClick = (data) => {
    setBarInfo(
      <CustomTimeDisplay
        data={data}
        utterances={utterances}
        speaker1={speaker1}
        speaker2={speaker2}
        formatTime={formatTime}
        styles={styles}
        speakers={speakers}
        color1={getLabelCategoryColor(data.name)}
        color2={darkenHexColor(getLabelCategoryColor(data.name), 0.6)}
        clickPlay={handleClickPlay}
        valuesToShow={valuesToShow}
      />
    );
  };

  const handleClickPlay = (time) => {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = time / 1000;
      video.play();
    }
  };
  const [valuesToShow, setValuesToShow] = useState("labels");

  const checkLabelSelected = (label) => {
    return Object.values(initialDialogicActs).some((group) =>
      group.labels.some((item) => item.label === label && item.selected)
    );
  };

  let chartData = utterances
    .filter((utterance) => utterance.start <= currentVideoTime)
    .map((utterance) => utterance[valuesToShow])
    .flat()
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
          .filter(
            (utterance) =>
              utterance[valuesToShow].includes(label) &&
              checkLabelSelected(label)
          ).length * -1,
      speaker2: utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .filter((utterance) =>
          speaker2 === "Everyone"
            ? true
            : String(utterance.speaker) === String(speaker2)
        )
        .filter(
          (utterance) =>
            utterance[valuesToShow].includes(label) && checkLabelSelected(label)
        ).length,
      speaker1Times: utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .filter((utterance) =>
          speaker1 === "Everyone"
            ? true
            : String(utterance.speaker) === String(speaker1)
        )
        .filter(
          (utterance) =>
            utterance[valuesToShow].includes(label) && checkLabelSelected(label)
        )
        .map((utterance) => utterance.start),
      speaker2Times: utterances
        .filter((utterance) => utterance.start <= currentVideoTime)
        .filter((utterance) =>
          speaker2 === "Everyone"
            ? true
            : String(utterance.speaker) === String(speaker2)
        )
        .filter(
          (utterance) =>
            utterance[valuesToShow].includes(label) && checkLabelSelected(label)
        )
        .map((utterance) => utterance.start),
    }))
    .filter((item) => item.speaker1 !== 0 || item.speaker2 !== 0)
    .sort((a, b) => a.speaker1 - b.speaker1);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const label = payload[0].payload.name;
      const definition = getLabelDefinition(label);

      return (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            border: "1px solid #555",
            padding: "10px",
            borderRadius: "8px",
            maxWidth: "250px",
            fontSize: "0.9rem",
            color: "#f1f1f1",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <strong style={{ color: "#fff", fontSize: "1rem" }}>{label}</strong>
          <p style={{ marginTop: "4px", lineHeight: "1.4" }}>{definition}</p>
        </div>
      );
    }

    return null;
  };

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

  const [charts, setCharts] = useState("bar");
  const handleCharts = (event, value) => {
    if (value !== null) {
      setCharts(value);
    }
  };

  const handleBarMouseEnter = (e) => {
    setHoveredBar(e.name);
    setProgressBarVisibility(true);
  };

  const handleBarMouseLeave = () => {
    setHoveredBar(null);
    setProgressBarVisibility(false);
  };

  const lastUtteranceRef = useRef(null);
  const scrollListRef = useRef(null);
  const prevUtterances = utterances.filter(
    (utterance) => utterance.start <= currentVideoTime
  );
  useEffect(() => {
    if (scrollListRef.current) {
      scrollListRef.current.scrollTop = scrollListRef.current.scrollHeight;
    }
  }, [prevUtterances.length, analysisPage]);

  const [votingUtteranceIndex, setVotingUtteranceIndex] = useState(-1);
  const [utteranceLabelsIndex, setUtteranceLabelsIndex] = useState(-1);
  const [sentimentPopover, setSentimentPopover] = useState(false);

  const containerRef = useRef();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const openPopover = () => {
    setAnchorEl(containerRef.current);
  };

  const closePopover = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);

  const castVote = (value, isSentiment, index, labelsIndex) => {
    const utteranceIndex = index ?? votingUtteranceIndex;
    const currLabelsIndex = labelsIndex ?? utteranceLabelsIndex ?? -1;
    const label = isSentiment ? value.label.toLowerCase() : value.label;

    const vote = {
      index: utteranceIndex,
    };

    if (isSentiment) {
      vote["sentiment"] = {
        add: {
          label: label,
        },
      };
    } else {
      vote["label"] = {
        add: {
          label: label,
          index: currLabelsIndex,
        },
      };
    }

    if (
      utteranceVotes[utteranceIndex + "," + currLabelsIndex + "," + isSentiment]
    ) {
      if (isSentiment) {
        vote["sentiment"].sub = {
          label:
            utteranceVotes[
            utteranceIndex + "," + currLabelsIndex + "," + isSentiment
            ],
        };
      } else {
        vote["label"].sub = {
          label:
            utteranceVotes[
            utteranceIndex + "," + currLabelsIndex + "," + isSentiment
            ],
          index: currLabelsIndex,
        };
      }
    }

    axios
      .post(`${config.BACKEND_URL}/utterance_vote`, {
        url: window.location.href,
        vote: vote,
      })
      .then(() => {
        utteranceVotes[
          utteranceIndex + "," + currLabelsIndex + "," + isSentiment
        ] = label;
        setUtteranceVotes({ ...utteranceVotes });

        if (popoverOpen) {
          closePopover();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div style={styles.container} ref={containerRef}>
      {popoverOpen && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgb(0, 0, 0, .8)",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 99,
          }}
        />
      )}
      <Popover
        PaperProps={{
          sx: { borderRadius: 0 },
        }}
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
      >
        <Box
          sx={{ p: 2, height: 500, backgroundColor: "#121212", color: "white" }}
        >
          <Typography variant="h5">Which label is most accurate?</Typography>
          <br />
          <Autocomplete
            disablePortal
            onChange={(event, value) => {
              castVote(value, sentimentPopover);
            }}
            options={
              sentimentPopover
                ? flattenDialogicActs(initialDialogicActs).filter((act) => {
                  return (
                    act.label === "negative" ||
                    act.label === "positive" ||
                    act.label === "neutral"
                  );
                })
                : flattenDialogicActs(initialDialogicActs).filter((act) => {
                  return (
                    act.label !== "negative" &&
                    act.label !== "positive" &&
                    act.label !== "neutral"
                  );
                })
            }
            getOptionLabel={(obj) => {
              return obj.label;
            }}
            isOptionEqualToValue={(a, b) => {
              return a.label === b.label;
            }}
            slotProps={{
              inputLabel: {
                color: "gray",
              },
              popper: {
                sx: {
                  "& .MuiAutocomplete-paper": {
                    backgroundColor: "#1e1e1e",
                    color: "#fff",
                  },
                },
              },
            }}
            sx={{
              "& .MuiInputBase-root": {
                color: "white",
                backgroundColor: "#1e1e1e",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "gray",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "white",
              },
              "& .MuiInputLabel-root": {
                color: "gray",
              },
              width: 300,
            }}
            renderInput={(params) => <TextField {...params} label="Label" />}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box
                  key={key}
                  component="li"
                  sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                  {...optionProps}
                >
                  <Stack direction="column" spacing={1}>
                    <Typography variant="h5">
                      {option.label.charAt(0).toUpperCase() +
                        option.label.slice(1)}
                    </Typography>
                    <Typography variant="body2">{option.definition}</Typography>
                  </Stack>
                </Box>
              );
            }}
          />
        </Box>
      </Popover>
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <h2>AI Utterance Analysis</h2>
        <Stack spacing={2} direction="row" sx={{ mt: "-6px" }}>
          <ToggleButtonGroup
            value={analysisPage}
            exclusive
            onChange={(event, value) => {
              setAnalysisPage(value);
            }}
            aria-label="single or multiple video analysis"
            sx={{
              backgroundColor: "#ffffff33",
              "& .MuiToggleButton-root": {
                color: "white",
                border: "none",
                "&:hover": {
                  backgroundColor: "#ffffff44",
                },
              },
              "& .MuiToggleButton-root.Mui-selected": {
                backgroundColor: "#ffffff66",
                color: "white",
                "&:hover": {
                  backgroundColor: "#ffffff88",
                },
              },
            }}
          >
            <ToggleButton value="single" aria-label="single">
              <SmartDisplay />
            </ToggleButton>

            <ToggleButton value="library" aria-label="library">
              <VideoLibrary />
            </ToggleButton>

            <ToggleButton value="settings" aria-label="settings">
              <Settings />
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton
            sx={{
              mt: -1.5,
              mr: -2,
              padding: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
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
                stroke: "#868686",
                fill: "#f1f1f1",
              }}
            >
              <path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path>
            </svg>
          </IconButton>
        </Stack>
      </Stack>
      {analysisPage === "single" && (
        <Box
          sx={{
            fontFamily: "Arial, sans-serif",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: "1rem",
            width: "100%",
          }}
        >
          <div ref={scrollListRef} style={styles.scrolllist}>
            {prevUtterances.length > 0 ? (
              <>
                {prevUtterances.map((utterance, index, array) => (
                  <div
                    style={
                      index === prevUtterances.length - 1
                        ? styles.scrollListItemContainerLast
                        : styles.scrollListItemContainer
                    }
                  >
                    <div
                      ref={index === array.length - 1 ? lastUtteranceRef : null}
                      key={utterance.start}
                      style={styles.scrollListItem}
                    >
                      <h3
                        onClick={() => {
                          handleClickPlay(utterance.start);
                        }}
                        style={styles.time}
                      >
                        {formatTime(utterance.start)}
                      </h3>

                      <h3
                        style={{
                          ...styles.speaker,
                        }}
                      >
                        {speakers[utterance.speaker]}{" "}
                        {index === prevUtterances.length - 1 && "🔊"}
                      </h3>
                    </div>
                    <h2 style={{ paddingTop: ".5rem", paddingBottom: ".5rem" }}>
                      "{utterance.text}"
                    </h2>

                    <LabelVoting
                      styles={styles}
                      setValuesToShow={setValuesToShow}
                      castVote={castVote}
                      openPopover={openPopover}
                      setSentimentPopover={setSentimentPopover}
                      setVotingUtteranceIndex={setVotingUtteranceIndex}
                      setUtteranceLabelsIndex={setUtteranceLabelsIndex}
                      getLabelCategoryColor={getLabelCategoryColor}
                      sentiment={utterance.sentiment}
                      labels={utterance.labels}
                      index={index}
                    />
                  </div>
                ))}
              </>
            )
              :
              (
                <>
                  <Skeleton sx={{ width: "100%", height: 40, transform: "initial" }} animation="wave" />
                  <Skeleton sx={{ width: "100%", height: 50, transform: "initial" }} animation="wave" />
                  <Skeleton sx={{ width: "100%", height: 30, transform: "initial" }} animation="wave" />
                </>
              )}

          </div>
          <div style={styles.speakerSelect}>
            <select
              value={speaker1}
              label="speaker"
              onChange={handleChangeSpeaker1}
              style={styles.select}
            >
              <option value={"Everyone"} style={styles.option}>
                All Speakers
              </option>
              {Object.entries(speakers).map(([key, value]) => (
                <option key={key} value={key} style={styles.option}>
                  {value}
                </option>
              ))}
            </select>

            <ToggleButtonGroup
              value={charts}
              exclusive
              onChange={handleCharts}
              aria-label="chart type"
              sx={{
                backgroundColor: "#ffffff33",
                "& .MuiToggleButton-root": {
                  color: "white",
                  border: "none",
                  "&:hover": {
                    backgroundColor: "#ffffff44",
                  },
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  backgroundColor: "#ffffff66",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#ffffff88",
                  },
                },
              }}
            >
              <ToggleButton value="bar" aria-label="bar">
                <BarChartIcon />
              </ToggleButton>

              <ToggleButton value="pie" aria-label="pie">
                <PieChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>

            <select
              value={speaker2}
              label="speaker"
              onChange={handleChangeSpeaker2}
              style={styles.select}
            >
              <option value={"Everyone"} style={styles.option}>
                All Speakers
              </option>
              {Object.entries(speakers).map(([key, value]) => (
                <option key={key} value={key} style={styles.option}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          {chartData.length > 0 ? (
            <>
              {charts === "bar" ? (
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
                    <XAxis
                      type="number"
                      tickFormatter={(value) => Math.abs(value)}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickFormatter={(name) => name.replace(/\//g, "/ ")}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <ReferenceLine x={0} stroke="#000" />
                    <Bar
                      dataKey="speaker1"
                      stackId="stack"
                      onClick={handleBarClick}
                      onMouseEnter={handleBarMouseEnter}
                      onMouseLeave={handleBarMouseLeave}
                    >
                      {chartData.map((entry, index) => {
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={getLabelCategoryColor(entry.name)}
                          />
                        );
                      })}
                    </Bar>
                    <Bar
                      dataKey="speaker2"
                      stackId="stack"
                      onClick={handleBarClick}
                      onMouseEnter={handleBarMouseEnter}
                      onMouseLeave={handleBarMouseLeave}
                    >
                      {chartData.map((entry, index) => {
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={darkenHexColor(getLabelCategoryColor(entry.name))}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: "100%", display: "flex" }}>
                  <CustomPieBoth
                    data1={chartData.map((l) => ({
                      ...l,
                      value: l.speaker1Times.length,
                      color: getLabelCategoryColor(l.name),
                      text: getLabelDefinition(l.name),
                      speaker: speakers[speaker1],
                    }))}
                    data2={chartData.map((l) => ({
                      ...l,
                      value: l.speaker2Times.length,
                      color: darkenHexColor(getLabelCategoryColor(l.name)),
                      text: getLabelDefinition(l.name),
                      speaker: speakers[speaker2],
                    }))}
                    width={"100%"}
                    height={300}
                    handleClick={handleBarClick}
                    handleMouseEnter={handleBarMouseEnter}
                    handleMouseLeave={handleBarMouseLeave}
                  />
                </div>
              )}
              {barInfo}
            </>
          ) : (
            <Skeleton sx={{ width: "100%", height: 300, transform: "initial" }} animation="wave" />
          )}
        </Box>
      )
      }
      {
        analysisPage === "library" && (
          <LibraryAnalysis speakers={autofillSpeakers} />
        )
      }

      {
        analysisPage === "settings" && (
          <SettingsPage
            dialogicActs={newDialogicActs}
            setDialogicActs={setNewDialogicActs}
            styles={styles}
            speakers={speakers}
            utterances={utterances}
            currentVideoTime={currentVideoTime}
            editedSpeakers={editedSpeakers}
            setEditedSpeakers={setEditedSpeakers}
            getAutofillSpeakers={getAutofillSpeakers}
            setPreviousSpeakerName={setPreviousSpeakerName}
            previousSpeakerName={previousSpeakerName}
            handleUpdateNickname={handleUpdateNickname}
            config={config}
          />
        )
      }
    </div >
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
