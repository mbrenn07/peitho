import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

export function CustomPieBoth({
  data1,
  data2,
  width,
  height,
  handleClick = () => {},
  handleMouseEnter = () => {},
  handleMouseLeave = () => {},
}) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const name = payload[0].payload.name;
      const value = payload[0].payload.value;
      const text = payload[0].payload.text ?? "";
      const speaker = payload[0].payload.speaker ?? "";

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
          <strong style={{ color: "#fff", fontSize: "1.2rem" }}>
            {speaker}
          </strong>
          <p>
            <strong style={{ color: "#fff", fontSize: "1rem" }}>
              {name}: {value} occurrences
            </strong>
          </p>
          <p style={{ marginTop: "4px", lineHeight: "1.4" }}>{text}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          data={data2}
          cx="50%"
          cy="50%"
          innerRadius={"40%"}
          outerRadius={"60%"}
          dataKey="value"
          stroke="#212121"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {data2.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={data2[index].color}
              onClick={handleClick}
            />
          ))}
        </Pie>
        <Pie
          data={data1}
          cx="50%"
          cy="50%"
          innerRadius={"70%"}
          outerRadius={"90%"}
          dataKey="value"
          stroke="#212121"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {data1.map((_, index) => (
            <Cell key={`cell-${index}`} fill={data1[index].color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
