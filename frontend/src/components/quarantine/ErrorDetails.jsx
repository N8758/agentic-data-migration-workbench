import React from "react";

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000
  },
  modal: {
    width: "min(900px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)"
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
    padding: "22px 24px",
    borderBottom: "1px solid #e5e7eb"
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827"
  },
  subtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  },
  close: {
    width: "34px",
    height: "34px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "18px",
    color: "#4b5563"
  },
  content: {
    padding: "24px"
  },
  section: {
    marginBottom: "22px"
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  errorBox: {
    padding: "15px",
    borderRadius: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: "13px",
    lineHeight: 1.6
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "12px"
  },
  info: {
    padding: "14px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px"
  },
  label: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase"
  },
  value: {
    marginTop: "5px",
    fontSize: "13px",
    color: "#111827",
    fontWeight: 600,
    wordBreak: "break-word"
  },
  code: {
    margin: 0,
    padding: "16px",
    background: "#111827",
    color: "#e5e7eb",
    borderRadius: "10px",
    fontSize: "12px",
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "18px 24px",
    borderTop: "1px solid #e5e7eb"
  },
  button: {
    border: 0,
    borderRadius: "9px",
    padding: "10px 18px",
    background: "#111827",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer"
  },
  empty: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280"
  }
};

function formatJson(value) {
  if (value === null || value === undefined) {
    return "No data";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ErrorDetails({
  record,
  error,
  onClose
}) {
  if (!record && !error) {
    return null;
  }

  const currentError =
    error ||
    record?.error ||
    record?.error_message ||
    record?.validation_error ||
    record?.message ||
    "Validation failed";

  const recordId =
    record?.record_id ??
    record?.source_id ??
    record?.id ??
    "—";

  const field =
    record?.field ||
    record?.field_name ||
    record?.failed_field ||
    "—";

  const sourceData =
    record?.source ||
    record?.source_data ||
    record?.source_record ||
    null;

  const transformedData =
    record?.transformed ||
    record?.transformed_data ||
    record?.target ||
    record?.target_data ||
    null;

  return (
    <div
      style={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              Quarantine Error Details
            </h2>

            <p style={styles.subtitle}>
              Field-level evidence for the rejected migration record.
            </p>
          </div>

          <button
            type="button"
            style={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              Record Information
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.info}>
                <div style={styles.label}>Record ID</div>
                <div style={styles.value}>{recordId}</div>
              </div>

              <div style={styles.info}>
                <div style={styles.label}>Failed Field</div>
                <div style={styles.value}>{field}</div>
              </div>

              <div style={styles.info}>
                <div style={styles.label}>Status</div>
                <div style={styles.value}>
                  {record?.status || "Quarantined"}
                </div>
              </div>

              <div style={styles.info}>
                <div style={styles.label}>Run ID</div>
                <div style={styles.value}>
                  {record?.run_id || "—"}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              Validation Error
            </div>

            <div style={styles.errorBox}>
              {currentError}
            </div>
          </div>

          {record?.expected !== undefined && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Expected Value
              </div>

              <pre style={styles.code}>
                {formatJson(record.expected)}
              </pre>
            </div>
          )}

          {record?.actual !== undefined && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Actual Value
              </div>

              <pre style={styles.code}>
                {formatJson(record.actual)}
              </pre>
            </div>
          )}

          {sourceData !== null && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Source Record
              </div>

              <pre style={styles.code}>
                {formatJson(sourceData)}
              </pre>
            </div>
          )}

          {transformedData !== null && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Transformed Record
              </div>

              <pre style={styles.code}>
                {formatJson(transformedData)}
              </pre>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            style={styles.button}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}