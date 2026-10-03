import React from "react";

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)"
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 750,
    color: "#111827"
  },
  subtitle: {
    margin: "6px 0 22px",
    fontSize: "13px",
    color: "#6b7280"
  },
  comparison: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "16px"
  },
  box: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    background: "#f8fafc"
  },
  label: {
    fontSize: "11px",
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: "0.04em"
  },
  value: {
    marginTop: "8px",
    fontSize: "30px",
    fontWeight: 800,
    color: "#111827"
  },
  description: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#6b7280"
  },
  operator: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef2ff",
    color: "#4338ca",
    fontWeight: 800
  },
  result: {
    marginTop: "20px",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap"
  },
  success: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534"
  },
  danger: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b"
  },
  resultTitle: {
    fontSize: "13px",
    fontWeight: 700
  },
  resultValue: {
    fontSize: "13px",
    fontWeight: 800
  },
  progressContainer: {
    marginTop: "20px"
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "12px",
    color: "#6b7280"
  },
  progressTrack: {
    width: "100%",
    height: "9px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "#111827",
    transition: "width 0.3s ease"
  }
};

function normalize(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export default function CountComparison({
  sourceCount = 0,
  acceptedCount = 0,
  targetCount = 0,
  sourceLabel = "Accepted Records",
  targetLabel = "Target Records"
}) {
  const source = normalize(sourceCount);
  const target = normalize(targetCount);

  const difference = target - source;
  const reconciled = difference === 0;

  const percentage =
    source > 0
      ? Math.min((target / source) * 100, 100)
      : target === 0
      ? 100
      : 0;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Count Comparison</h2>

      <p style={styles.subtitle}>
        Verify that the number of records written to the target matches the
        records accepted during the migration.
      </p>

      <div style={styles.comparison}>
        <div style={styles.box}>
          <div style={styles.label}>{sourceLabel}</div>
          <div style={styles.value}>{source}</div>
          <div style={styles.description}>
            Records expected to reach target
          </div>
        </div>

        <div style={styles.operator}>=</div>

        <div style={styles.box}>
          <div style={styles.label}>{targetLabel}</div>
          <div style={styles.value}>{target}</div>
          <div style={styles.description}>
            Records currently in target
          </div>
        </div>
      </div>

      <div
        style={{
          ...styles.result,
          ...(reconciled ? styles.success : styles.danger)
        }}
      >
        <span style={styles.resultTitle}>
          {reconciled
            ? "Counts match successfully"
            : "Count mismatch detected"}
        </span>

        <span style={styles.resultValue}>
          Difference: {difference}
        </span>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressHeader}>
          <span>Target coverage</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${percentage}%`
            }}
          />
        </div>
      </div>

      {acceptedCount !== undefined && (
        <div
          style={{
            marginTop: "14px",
            fontSize: "12px",
            color: "#6b7280"
          }}
        >
          Accepted during dry run:{" "}
          <strong style={{ color: "#111827" }}>
            {normalize(acceptedCount)}
          </strong>
        </div>
      )}
    </div>
  );
}