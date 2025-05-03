import { ThumbDown, ThumbUp } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

export function LabelVoting({
  styles,
  setValuesToShow,
  castVote,
  openPopover,
  setSentimentPopover,
  setVotingUtteranceIndex,
  labelToColor,
  sentiment,
  label,
  index,
}) {
  const [displayUtteranceThumbs, setDisplayUtteranceThumbs] = useState(false);
  const [displaySentimentThumbs, setDisplaySentimentThumbs] = useState(false);

  return (
    <Stack direction="row" spacing={1}>
      <Box
        style={styles.labels}
        onMouseEnter={() => {
          setDisplayUtteranceThumbs(true);
        }}
        onMouseLeave={() => {
          setDisplayUtteranceThumbs(false);
        }}
      >
        <button style={styles.label} onClick={() => setValuesToShow("label")}>
          {label}
        </button>
        {displayUtteranceThumbs && (
          <Box
            sx={{
              position: "absolute",
              bottom: "-10px",
              right: 0,
              gap: 1,
              flexDirection: "row",
            }}
          >
            <IconButton
              onClick={() => {
                const utteranceLabel = {
                  label: label,
                };
                castVote(utteranceLabel, false, index);
              }}
              sx={{
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgb(255, 255, 255)", // Change to your desired color
                },
                color: "green",
              }}
            >
              <ThumbUp />
            </IconButton>
            <IconButton
              onClick={() => {
                setVotingUtteranceIndex(index);
                setSentimentPopover(false);
                openPopover();
              }}
              sx={{
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgb(255, 255, 255)", // Change to your desired color
                },
                color: "red",
              }}
            >
              <ThumbDown />
            </IconButton>
          </Box>
        )}
      </Box>
      <Box
        style={styles.labels}
        onMouseEnter={() => {
          setDisplaySentimentThumbs(true);
        }}
        onMouseLeave={() => {
          setDisplaySentimentThumbs(false);
        }}
      >
        <button
          style={{
            ...styles.label,
            backgroundColor: labelToColor[sentiment],
          }}
          onClick={() => setValuesToShow("sentiment")}
        >
          {sentiment}
        </button>

        {displaySentimentThumbs && (
          <Box
            sx={{
              position: "absolute",
              bottom: "-10px",
              right: 0,
              gap: 1,
              flexDirection: "row",
            }}
          >
            <IconButton
              onClick={() => {
                const utteranceLabel = {
                  label: sentiment,
                };
                castVote(utteranceLabel, true, index);
              }}
              sx={{
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgb(255, 255, 255)", // Change to your desired color
                },
                color: "green",
              }}
            >
              <ThumbUp />
            </IconButton>
            <IconButton
              onClick={() => {
                setVotingUtteranceIndex(index);
                setSentimentPopover(true);
                openPopover();
              }}
              sx={{
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgb(255, 255, 255)", // Change to your desired color
                },
                color: "red",
              }}
            >
              <ThumbDown />
            </IconButton>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
