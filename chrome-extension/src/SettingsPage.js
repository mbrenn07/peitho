import {
  Box,
  Checkbox,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import axios from "axios";

export function SettingsPage({
  dialogicActs,
  setDialogicActs,
  styles,
  speakers,
  utterances,
  currentVideoTime,
  editedSpeakers,
  setEditedSpeakers,
  getAutofillSpeakers,
  setPreviousSpeakerName,
  previousSpeakerName,
  handleUpdateNickname,
  config,
  shouldShimmerSpeakers,
  shimmerStyles
}) {
  const handleToggle = (category, index) => () => {
    setDialogicActs((prev) => {
      const updated = { ...prev };
      updated[category].labels[index].selected =
        !updated[category].labels[index].selected;
      return { ...updated };
    });
  };

  const handleToggleAll = (category) => () => {
    setDialogicActs((prev) => {
      const allSelected = prev[category].labels.every((item) => item.selected);
      const updated = { ...prev };
      updated[category].labels.map((labels) => (labels.selected = !allSelected));
      console.log("Updated dialogicActs:", updated);
      return { ...updated };
    });
    console.log(dialogicActs);
  };
  return (
    <Box>
      <h2 style={{ marginBottom: "1rem" }}>Edit Speakers:</h2>
      <div style={styles.labels}>
        {Object.entries(speakers).map(([key, value], index) => (
          <div
            key={key}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              ...(shouldShimmerSpeakers ? shimmerStyles() : {})
            }}
          >
            <input
              style={{
                ...styles.speaker,
                width: `${(value.length || 1) + 1}ch`,
                border:
                  utterances
                    .filter((utterance) => utterance.start <= currentVideoTime)
                    .slice(-1)[0]?.speaker === key
                    ? "2px solid #ffffff"
                    : "none",
                paddingRight: "1.5rem", // make room for ornament
              }}
              type="text"
              key={key}
              value={value}
              onChange={(event) => handleUpdateNickname(event, key)}
              onFocus={() => {
                setPreviousSpeakerName(value);
              }}
              onBlur={() => {
                if (value === previousSpeakerName) {
                  return;
                }

                const vote_diff = {
                  add: {
                    index: "" + index,
                    name: value.toLowerCase(),
                  },
                };

                if (editedSpeakers[index]) {
                  vote_diff.sub = {
                    index: "" + index,
                    name: previousSpeakerName.toLowerCase(),
                  };
                }

                editedSpeakers[index] = true;
                setEditedSpeakers({ ...editedSpeakers });

                setPreviousSpeakerName(value);

                axios
                  .post(`${config.BACKEND_URL}/speaker_vote`, {
                    url: window.location.href,
                    vote_diff: vote_diff,
                  })
                  .then(() => {
                    getAutofillSpeakers();
                  })
                  .catch((error) => {
                    console.error(error);
                  });
              }}
            />

            {key ===
              String(
                utterances
                  .filter((utterance) => utterance.start <= currentVideoTime)
                  .slice(-1)[0]?.speaker
              ) && (
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
      <h2 style={{ marginTop: "1rem" }}>Edit Categories:</h2>
      <List
        sx={{
          width: "100%",
          bgcolor: "none",
          color: "white",
        }}
      >
        {Object.entries(dialogicActs).map(([category, { labels, color }]) => {
          const allSelected = labels.every((item) => item.selected);

          return (
            <div key={category}>
              <ListItem
                dense
                sx={{
                  color: "white",
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={allSelected}
                    indeterminate={
                      !allSelected && labels.some((item) => item.selected)
                    }
                    tabIndex={-1}
                    disableRipple
                    onChange={handleToggleAll(category)}
                    sx={{
                      color: "white", // for unchecked
                      "&.Mui-checked": {
                        color: color, // for checked
                      },
                      "&.MuiCheckbox-indeterminate": {
                        color: color,
                      },
                      "& .MuiSvgIcon-root": { fontSize: 28 },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="h5">{category}</Typography>}
                />
              </ListItem>
              {labels.map(({ label, selected }, index) => (
                <ListItem key={`${category}-${label}`} disablePadding>
                  <ListItemButton
                    role={undefined}
                    onClick={handleToggle(category, index)}
                    dense
                    sx={{ ml: 3 }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selected}
                        tabIndex={-1}
                        disableRipple
                        sx={{
                          color: "white", // for unchecked
                          "& .MuiSvgIcon-root": { fontSize: 28 },
                          "&.Mui-checked": {
                            color: color, // for checked
                          },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="h6">{label}</Typography>}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {/* <Divider sx={{ my: 1, borderColor: "white" }} /> */}
            </div>
          );
        })}
      </List>
    </Box>
  );
}
