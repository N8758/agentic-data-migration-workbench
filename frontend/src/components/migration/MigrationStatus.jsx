import React from "react";
import ProgressBar from "./ProgressBar";

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 18px rgba(15,23,42,.06)",
    marginBottom: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    flexWrap: "wrap"
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827"
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#6b7280"
  },
  badge: {
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase"
  },
  success: {
    background: "#dcfce7",
    color: "#166534"
  },
  running: {
    background: "#dbeafe",
    color: "#1d4ed8"
  },
  failed: {
    background: "#fee2e2",
    color: "#991b1b"
  },
  pending: {
    background: "#fef3c7",
    color: "#92400e"
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
    gap: "14px",
    marginTop: "22px"
  },
  stat: {
    padding: "15px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px"
  },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase"
  },
  value: {
    marginTop: "6px",
    fontSize: "22px",
    fontWeight: 800,
    color: "#111827"
  },
  error: {
    marginTop: "18px",
    padding: "13px 15px",
    borderRadius: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "13px"
  }
};

function getStatusStyle(status) {
  const normalized = String(status || "pending").toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "success" ||
    normalized === "successful"
  ) {
    return styles.success;
  }

  if (
    normalized === "running" ||
    normalized === "processing"
  ) {
    return styles.running;
  }

  if (
    normalized === "failed" ||
    normalized === "error"
  ) {
    return styles.failed;
  }

  return styles.pending;
}

export default function MigrationStatus({
  migration = null,
  status,
  progress,
  sourceCount,
  acceptedCount,
  rejectedCount,
  targetCount,
  error
}) {
  const currentStatus =
    status ||
    migration?.status ||
    "pending";

  const calculatedProgress =
    progress ??
    migration?.progress ??
    migration?.progress_percentage ??
    0;

  const source =
    sourceCount ??
    migration?.source_count ??
    migration?.total_source ??
    0;

  const accepted =
    acceptedCount ??
    migration?.accepted_count ??
    0;

  const rejected =
    rejectedCount ??
    migration?.rejected_count ??
    0;

  const target =
    targetCount ??
    migration?.target_count ??
    0;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Migration Status</h2>
          <p style={styles.subtitle}>
            Current execution state and migration metrics.
          </p>
        </div>

        <span
          style={{
            ...styles.badge,
            ...getStatusStyle(currentStatus)
          }}
        >
          {currentStatus}
        </span>
      </div>

      <ProgressBar
        value={calculatedProgress}
        label="Execution Progress"
      />

      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.label}>Source</div>
          <div style={styles.value}>{source}</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.label}>Accepted</div>
          <div style={styles.value}>{accepted}</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.label}>Rejected</div>
          <div style={styles.value}>{rejected}</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.label}>Target</div>
          <div style={styles.value}>{target}</div>
        </div>
      </div>

      {(error || migration?.error) && (
        <div style={styles.error}>
          {error || migration?.error}
        </div>
      )}
    </div>
  );
}