import { Button, Collapse, IconButton, Zoom } from "@mui/material";
import { useState } from "react";
import { CustomSlider } from "./CustomSlider";
import {
  Brush,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { CustomPie } from "./CustomPie";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";

export function CustomTimeDisplay({
  data,
  utterances,
  speaker1,
  speaker2,
  formatTime,
  styles,
  speakers,
  color1,
  color2,
  clickPlay,
  valuesToShow,
}) {
  const sliderSpeaker1 = data.speaker1Times.map((time, i) => {
    const utteranceText =
      utterances.find((u) => {
        return (
          u.start === time &&
          u[valuesToShow].includes(data.name) &&
          (speaker1 === "Everyone" || String(u.speaker) === String(speaker1))
        );
      })?.text || "";
    return {
      value: time,
      y: 2,
      label: formatTime(time),
      text: utteranceText,
      z: utteranceText.length,
    };
  });

  const sliderSpeaker2 = data.speaker2Times.map((time, i) => {
    const utteranceText =
      utterances.find((u) => {
        return (
          u.start === time &&
          u[valuesToShow].includes(data.name) &&
          (speaker2 === "Everyone" || String(u.speaker) === String(speaker2))
        );
      })?.text || "";
    return {
      value: time,
      y: 1,
      label: formatTime(time),
      text: utteranceText,
      z: utteranceText.length,
    };
  });

  const [listSpeakers, setListSpeakers] = useState(2);

  const handleYTick = (tick) => {
    if (tick === 1) {
      return speakers[speaker2] ?? "All Speakers";
    } else if (tick === 2) {
      return speakers[speaker1] ?? "All Speakers";
    } else {
      return "";
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const label = payload[0].payload.label;
      const text = payload[0].payload.text;

      // const definition = labelToDefinition[label];

      return (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            border: "1px solid #555",
            padding: "10px",
            borderRadius: "8px",
            maxWidth: "300px",
            fontSize: "0.9rem",
            color: "#f1f1f1",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <strong style={{ color: "#fff", fontSize: "1rem" }}>{label}</strong>
          <p style={{ marginTop: "4px", lineHeight: "1.4" }}>{text}</p>
        </div>
      );
    }

    return null;
  };

  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [xDomain, setXDomain] = useState(["auto", "auto"]);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    const left = Math.min(refAreaLeft, refAreaRight);
    const right = Math.max(refAreaLeft, refAreaRight);

    setXDomain([left, right]);
    setRefAreaLeft("");
    setRefAreaRight("");
  };

  const zoomOut = () => {
    setXDomain(["auto", "auto"]);
    setRefAreaLeft("");
    setRefAreaRight("");
  };

  const handleScatterClick = (event) => {
    console.log("scat", event);
    if (event.value) {
      clickPlay(event.value);
    }
  };

  return (
    <div style={styles.barInfo}>
      <div style={{ position: "absolute", top: "0", right: "0", zIndex: 1 }}>
        <CustomPie
          data={[
            {
              name: speakers[speaker1] ?? "All Speakers",
              value: sliderSpeaker1
                .filter((e) =>
                  xDomain[0] === "auto" ? true : e.value >= xDomain[0]
                )
                .filter((e) =>
                  xDomain[1] === "auto" ? true : e.value <= xDomain[1]
                ).length,
              color: color1,
            },
            {
              name: speakers[speaker2] ?? "All Speakers",
              value: sliderSpeaker2
                .filter((e) =>
                  xDomain[0] === "auto" ? true : e.value >= xDomain[0]
                )
                .filter((e) =>
                  xDomain[1] === "auto" ? true : e.value <= xDomain[1]
                ).length,
              color: color2,
            },
          ]}
          width={200}
          height={100}
        />
      </div>
      <h2>{data.name}</h2>
      <div style={{ display: "flex", gap: "1rem" }}>
        <h3
          onClick={() => setListSpeakers(listSpeakers === 0 ? 2 : 0)}
          style={{
            textDecoration: "underline",
            cursor: "pointer",
            fontWeight: listSpeakers === 0 ? "bolder" : "lighter",
          }}
          title="list times for speaker"
        >
          {speakers[speaker1] ?? "All Speakers"}
        </h3>
        <p>v.</p>
        <h3
          onClick={() => setListSpeakers(listSpeakers === 1 ? 2 : 1)}
          style={{
            textDecoration: "underline",
            cursor: "pointer",
            fontWeight: listSpeakers === 1 ? "bolder" : "lighter",
          }}
          title="list times for speaker"
        >
          {speakers[speaker2] ?? "All Speakers"}
        </h3>
      </div>

      <div style={{ userSelect: "none", width: "100%" }}>
        <IconButton title="zoom out" onClick={zoomOut} sx={{ color: "#fff" }}>
          <ZoomOutMapIcon />
        </IconButton>
        <ResponsiveContainer width="100%" height={150}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            onMouseDown={(e) => setRefAreaLeft(Math.floor(e.xValue))}
            onMouseMove={(e) =>
              refAreaLeft && setRefAreaRight(Math.floor(e.xValue))
            }
            onMouseUp={zoom}
          >
            <XAxis
              allowDataOverflow
              type="number"
              dataKey="value"
              name="time"
              tickFormatter={formatTime}
              domain={xDomain}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="speaker"
              ticks={[0, 1, 2, 3]}
              tickFormatter={handleYTick}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[0, 100]}
              domain={[0, 100]}
              tick={false}
            />

            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<CustomTooltip />}
              position={{ x: 0, y: 0 }}
            />
            <Legend />
            <Scatter
              name={speakers[speaker1] ?? "All Speakers"}
              data={sliderSpeaker1}
              fill={color1}
              onMouseDown={handleScatterClick}
            />
            <Scatter
              name={speakers[speaker2] ?? "All Speakers"}
              data={sliderSpeaker2}
              fill={color2}
              onMouseDown={handleScatterClick}
            />

            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <Collapse in={listSpeakers === 0}>
        <div style={styles.labels}>
          {sliderSpeaker1.map((time, i) => (
            <button
              key={`speaker1-${i}`}
              style={{
                ...styles.time,
                cursor: "pointer",
                border: "none",
              }}
              title={time.text}
              onClick={() => {
                const video = document.querySelector("video");
                if (video) {
                  video.currentTime = time / 1000;
                  video.play();
                }
              }}
            >
              {time.label}
            </button>
          ))}{" "}
        </div>
      </Collapse>
      <Collapse in={listSpeakers === 1}>
        <div style={styles.labels}>
          {sliderSpeaker2.map((time, i) => (
            <button
              key={`speaker1-${i}`}
              style={{
                ...styles.time,
                cursor: "pointer",
                border: "none",
              }}
              title={time.text}
              onClick={() => {
                clickPlay(time.value);
              }}
            >
              {time.label}
            </button>
          ))}{" "}
        </div>
      </Collapse>
      {/* <CustomSlider marks={sliderSpeaker1} /> */}
    </div>
  );
}
