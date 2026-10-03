import React, { useState } from "react";

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 18px rgba(15,23,42,.06)",
    marginBottom: "20px"
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827"
  },
  subtitle: {
    margin: "6px 0 20px",
    color: "#6b7280",
    fontSize: "13px"
  },
  warning: {
    padding: "13px 15px",
    borderRadius: "10px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    fontSize: "13px",
    marginBottom: "18px"
  },
  button: {
    border: 0,
    borderRadius: "10px",
    padding: "12px 20px",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "13px"
  },
  disabled: {
    opacity: 0.55,
    cursor: "not-allowed"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: "14px",
    marginBottom: "20px"
  },
  item: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "15px"
  },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase"
  },
  value: {
    marginTop: "6px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#111827"
  }
};

export default function ExecutionPanel({
  plan = null,
  approved = false,
  loading = false,
  onExecute
}) {
  const [message, setMessage] = useState("");

  const canExecute =
    approved ||
    plan?.status === "approved";

  const handleExecute = async () => {
    setMessage("");

    try {
      if (onExecute) {
        await onExecute(plan?.id);
        setMessage("Migration execution started successfully.");
      }
    } catch (error) {
      setMessage(
        error?.response?.data?.detail ||
          error?.message ||
          "Migration execution failed."
      );
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Execute Migration</h2>

      <p style={styles.subtitle}>
        Execute the approved migration against the mock target store.
      </p>

      <div style={styles.infoGrid}>
        <div style={styles.item}>
          <div style={styles.label}>Plan</div>
          <div style={styles.value}>
            {plan?.id || "—"}
          </div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Status</div>
          <div style={styles.value}>
            {plan?.status || "Pending"}
          </div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Target</div>
          <div style={styles.value}>
            Mock Target
          </div>
        </div>
      </div>

      {!canExecute && (
        <div style={styles.warning}>
          The migration plan must be approved before execution.
        </div>
      )}

      <button
        type="button"
        onClick={handleExecute}
        disabled={!canExecute || loading}
        style={{
          ...styles.button,
          ...((!canExecute || loading) ? styles.disabled : {})
        }}
      >
        {loading ? "Executing Migration..." : "Execute Migration"}
      </button>

      {message && (
        <div style={{ ...styles.warning, marginTop: "16px", marginBottom: 0 }}>
          {message}
        </div>
      )}
    </div>
  );
}