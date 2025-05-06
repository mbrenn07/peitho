import React from "react";
import config from "./config";

function App() {
  return (
    <div className="App" style={styles.container}>
      <h1 style={styles.title}>Peitho</h1>
      <a href={"https://www.youtube.com/watch?v=" + config.DEMO_URL} target="_blank" rel="noopener noreferrer">Demo Video</a>
    </div>
  );
}

// Styles
const styles = {
  container: {
    width: "300px",
    padding: "16px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "18px",
    marginBottom: "16px",
  },
};

export default App;
