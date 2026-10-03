import React from "react";

const styles = {
  wrapper: {
    width: "100%",
    margin: "16px 0"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151"
  },
  track: {
    width: "100%",
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: "999px",
    background: "#111827",
    transition: "width .35s ease"
  }
};

export default function ProgressBar({
  value = 0,
  label = "Migration Progress"
}) {
  const numericValue = Number(value);

  const progress = Number.isFinite(numericValue)
    ? Math.min(100, Math.max(0, numericValue))
    : 0;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div style={styles.track}>
        <div
          style={{
            ...styles.fill,
            width: `${progress}%`
          }}
        />
      </div>
    </div>
  );
}