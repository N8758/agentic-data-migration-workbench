import React from "react";

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
    marginBottom: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "16px",
    flexWrap: "wrap"
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827"
  },
  subtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#6b7280"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px"
  },
  stat: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    background: "#f9fafb"
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  value: {
    marginTop: "8px",
    fontSize: "28px",
    fontWeight: 800,
    color: "#111827"
  },
  accepted: {
    color: "#15803d"
  },
  rejected: {
    color: "#dc2626"
  },
  quarantined: {
    color: "#b45309"
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#ecfdf5",
    color: "#047857"
  }
};

function Stat({ label, value, valueStyle }) {
  return (
    <div style={styles.stat}>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, ...valueStyle }}>{value}</div>
    </div>
  );
}

export default function DryRunSummary({ summary = {}, loading = false }) {
  const sourceCount =
    summary.source_count ??
    summary.source_records ??
    summary.total_source ??
    summary.total ??
    0;

  const transformedCount =
    summary.transformed_count ??
    summary.transformed_records ??
    0;

  const acceptedCount =
    summary.accepted_count ??
    summary.accepted_records ??
    0;

  const rejectedCount =
    summary.rejected_count ??
    summary.rejected_records ??
    0;

  const quarantinedCount =
    summary.quarantined_count ??
    summary.quarantined_records ??
    rejectedCount;

  const status = summary.status || "Completed";

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.title}>Dry Run Summary</div>
        <div style={{ marginTop: "20px", color: "#6b7280" }}>
          Running deterministic validation...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Dry Run Summary</h2>
          <p style={styles.subtitle}>
            Migration preview without writing records to the target database.
          </p>
        </div>

        <div style={styles.status}>{status}</div>
      </div>

      <div style={styles.grid}>
        <Stat label="Source Records" value={sourceCount} />
        <Stat label="Transformed" value={transformedCount} />
        <Stat
          label="Accepted"
          value={acceptedCount}
          valueStyle={styles.accepted}
        />
        <Stat
          label="Rejected"
          value={rejectedCount}
          valueStyle={styles.rejected}
        />
        <Stat
          label="Quarantined"
          value={quarantinedCount}
          valueStyle={styles.quarantined}
        />
      </div>
    </div>
  );
}