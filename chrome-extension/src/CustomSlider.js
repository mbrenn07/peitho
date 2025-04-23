import { Slider } from "@mui/material";
import { useEffect, useRef } from "react";

export function CustomSlider({ marks, ...props }) {
  const sliderRef = useRef();

  const styles = {
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
  };

  useEffect(() => {
    const labelElements = sliderRef.current?.querySelectorAll(
      ".MuiSlider-markLabel"
    );

    labelElements.forEach((el, i) => {
      if (!(i === 0 || i === labelElements.length - 1)) {
        el.style.display = "none";
      }
    });
  }, [marks]);

  return (
    <div ref={sliderRef} style={{ width: "100%" }}>
      {marks.length > 1 && (
        <Slider
          marks={marks}
          aria-label="speaker times"
          defaultValue={marks[0].value || 0}
          // getAriaValueText={formatTime}
          min={marks[0].value || 0}
          max={marks[marks.length - 1].value || 100}
          step={null}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => {
            const match = marks.find((mark) => mark.value === value);
            return (
              <div
                style={{
                  width: "10rem",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <div>
                  <strong>{match?.label}</strong>
                </div>
                <p>{match?.text}</p>
              </div>
            );
          }}
          sx={{
            "& .MuiSlider-markLabel": {
              whiteSpace: "nowrap",
              ...styles.time, // apply your style
            },
          }}
        />
      )}
    </div>
  );
}
