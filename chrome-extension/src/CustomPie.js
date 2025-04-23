import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

export function CustomPie({ data, width, height, handleClick = () => {} }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const name = payload[0].payload.name;
      const value = payload[0].payload.value;
      const text = payload[0].payload.text ?? "";

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
          <strong style={{ color: "#fff", fontSize: "1rem" }}>
            {name}: {value} occurrences
          </strong>
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
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={"60%"}
          outerRadius={"80%"}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={data[index].color}
              onClick={handleClick}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
