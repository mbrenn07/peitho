import {
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

export function SettingsPage({ dialogicActs, setDialogicActs }) {
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
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          labels: prev[category].labels.map((item) => ({
            ...item,
            selected: !allSelected,
          })),
        },
      };
      return updated;
    });
  };
  return (
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
  );
}
