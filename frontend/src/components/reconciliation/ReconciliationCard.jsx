import React from "react";

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px"
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 750,
    color: "#111827"
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.5
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700
  },
  success: {
    background: "#dcfce7",
    color: "#166534"
  },
  warning: {
    background: "#fef3c7",
    color: "#92400e"
  },
  danger: {
    background: "#fee2e2",
    color: "#991b1b"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px"
  },
  metric: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
    background: "#f8fafc"
  },
  metricLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  metricValue: {
    marginTop: "8px",
    fontSize: "26px",
    fontWeight: 800,
    color: "#111827"
  },
  metricDescription: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#6b7280"
  },
  footer: {
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    color: "#6b7280",
    fontSize: "12px"
  }
};

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export default function ReconciliationCard({
  sourceCount = 0,
  acceptedCount = 0,
  rejectedCount = 0,
  targetCount = 0,
  runId,
  status,
  message
}) {
  const source = getNumber(sourceCount);
  const accepted = getNumber(acceptedCount);
  const rejected = getNumber(rejectedCount);
  const target = getNumber(targetCount);

  const expectedTarget = accepted;
  const difference = target - expectedTarget;

  const isReconciled = difference === 0;

  const resolvedStatus = String(status || "").toLowerCase();

  const statusStyle =
    resolvedStatus === "failed" || resolvedStatus === "error"
      ? styles.danger
      : isReconciled
      ? styles.success
      : styles.warning;

  const statusText =
    resolvedStatus === "failed" || resolvedStatus === "error"
      ? "Reconciliation Failed"
      : isReconciled
      ? "Reconciled"
      : "Mismatch Detected";

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Migration Reconciliation</h2>
          <p style={styles.subtitle}>
            Compare source, accepted, rejected, and target record counts.
          </p>
        </div>

        <div
          style={{
            ...styles.status,
            ...statusStyle
          }}
        >
          <span>{isReconciled ? "●" : "●"}</span>
          {statusText}
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Source Records</div>
          <div style={styles.metricValue}>{source}</div>
          <div style={styles.metricDescription}>
            Records received from source
          </div>
        </div>

        <div style={styles.metric}>
          <div style={styles.metricLabel}>Accepted</div>
          <div style={styles.metricValue}>{accepted}</div>
          <div style={styles.metricDescription}>
            Records eligible for migration
          </div>
        </div>

        <div style={styles.metric}>
          <div style={styles.metricLabel}>Rejected</div>
          <div style={styles.metricValue}>{rejected}</div>
          <div style={styles.metricDescription}>
            Records moved to quarantine
          </div>
        </div>

        <div style={styles.metric}>
          <div style={styles.metricLabel}>Target Records</div>
          <div style={styles.metricValue}>{target}</div>
          <div style={styles.metricDescription}>
            Records inserted into target
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <span>
          Expected target: <strong>{expectedTarget}</strong>
        </span>

        <span>
          Difference:{" "}
          <strong
            style={{
              color: difference === 0 ? "#166534" : "#b91c1c"
            }}
          >
            {difference}
          </strong>
        </span>

        {runId && <span>Run ID: {runId}</span>}

        {message && <span>{message}</span>}
      </div>
    </div>
  );
}