import { ThumbDown, ThumbUp } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
import React, { useState } from "react";

export function LabelVoting({
  styles,
  setValuesToShow,
  castVote,
  openPopover,
  setSentimentPopover,
  setVotingUtteranceIndex,
  setUtteranceLabelsIndex,
  getLabelCategoryColor,
  sentiment,
  labels,
  index,
  displayVotingDemo,
  shimmerStyles,
}) {
  const [displayUtteranceThumbs, setDisplayUtteranceThumbs] = useState([
    false,
    false,
    false,
  ]);
  const [displaySentimentThumbs, setDisplaySentimentThumbs] = useState(false);

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
      {labels.map((label, j) => {
        return (
          <Box
            style={styles.labels}
            onMouseEnter={() => {
              setDisplayUtteranceThumbs((oldDisplayUtteranceThumbs) => {
                oldDisplayUtteranceThumbs[j] = true;
                return [...oldDisplayUtteranceThumbs];
              });
            }}
            onMouseLeave={() => {
              setDisplayUtteranceThumbs((oldDisplayUtteranceThumbs) => {
                oldDisplayUtteranceThumbs[j] = false;
                return [...oldDisplayUtteranceThumbs];
              });
            }}
          >
            <button
              style={{
                ...styles.label,
                backgroundColor: getLabelCategoryColor(label),
                ...(displayVotingDemo ? shimmerStyles() : {})
              }}
              onClick={() => setValuesToShow("labels")}
            >
              {label}
            </button>
            {(displayUtteranceThumbs[j] || displayVotingDemo) && (
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
                    castVote(utteranceLabel, false, index, j);
                  }}
                  sx={{
                    p: 0.5,
                    "&:hover": {
                      backgroundColor: "rgb(255, 255, 255)",
                    },
                    color: "green",
                  }}
                >
                  <ThumbUp />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setVotingUtteranceIndex(index);
                    setUtteranceLabelsIndex(j);
                    setSentimentPopover(false);
                    openPopover();
                  }}
                  sx={{
                    p: 0.5,
                    "&:hover": {
                      backgroundColor: "rgb(255, 255, 255)",
                    },
                    color: "red",
                  }}
                >
                  <ThumbDown />
                </IconButton>
              </Box>
            )}
          </Box>
        );
      })}
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
            backgroundColor: getLabelCategoryColor(sentiment[0]),
            ...(displayVotingDemo ? shimmerStyles() : {})
          }}
          onClick={() => setValuesToShow("sentiment")}
        >
          {sentiment[0]}
        </button>

        {(displaySentimentThumbs || displayVotingDemo) && (
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
                  label: sentiment[0],
                };
                castVote(utteranceLabel, true, index, 0);
              }}
              sx={{
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgb(255, 255, 255)",
                },
                color: "green",
              }}
            >
              <ThumbUp />
            </IconButton>
            <IconButton
              onClick={() => {
                setVotingUtteranceIndex(index);
                setUtteranceLabelsIndex(0);
                setSentimentPopover(true);
                openPopover();
              }}
              sx={{
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgb(255, 255, 255)",
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
