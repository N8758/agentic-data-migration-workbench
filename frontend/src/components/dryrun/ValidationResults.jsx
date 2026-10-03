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
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "12px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px"
  },
  th: {
    textAlign: "left",
    padding: "13px 15px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
    fontWeight: 700,
    color: "#4b5563",
    textTransform: "uppercase"
  },
  td: {
    padding: "14px 15px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
    color: "#374151",
    verticalAlign: "top"
  },
  badge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700
  },
  valid: {
    background: "#dcfce7",
    color: "#166534"
  },
  invalid: {
    background: "#fee2e2",
    color: "#991b1b"
  },
  warning: {
    background: "#fef3c7",
    color: "#92400e"
  },
  empty: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px"
  },
  errorText: {
    color: "#b91c1c",
    fontSize: "12px",
    lineHeight: 1.5
  }
};

function getStatus(item) {
  if (
    item.valid === true ||
    item.status === "valid" ||
    item.status === "accepted"
  ) {
    return {
      label: "Valid",
      style: styles.valid
    };
  }

  if (
    item.status === "warning" ||
    item.severity === "warning"
  ) {
    return {
      label: "Warning",
      style: styles.warning
    };
  }

  return {
    label: "Invalid",
    style: styles.invalid
  };
}

export default function ValidationResults({
  results = [],
  validationResults = [],
  errors = []
}) {
  const items =
    Array.isArray(results) && results.length
      ? results
      : Array.isArray(validationResults)
      ? validationResults
      : [];

  const normalizedItems = items.length
    ? items
    : errors.map((error, index) => ({
        id: index + 1,
        valid: false,
        field: error.field,
        message: error.message || error.error,
        record_id: error.record_id
      }));

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Validation Results</h2>

      <p style={styles.subtitle}>
        Deterministic validation results generated during the dry run.
      </p>

      {!normalizedItems.length ? (
        <div style={styles.empty}>
          No validation issues were found.
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Record</th>
                <th style={styles.th}>Field</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Message</th>
              </tr>
            </thead>

            <tbody>
              {normalizedItems.map((item, index) => {
                const status = getStatus(item);

                return (
                  <tr key={item.id ?? item.record_id ?? index}>
                    <td style={styles.td}>
                      {item.record_id ??
                        item.source_id ??
                        item.id ??
                        index + 1}
                    </td>

                    <td style={styles.td}>
                      {item.field || item.field_name || "—"}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...status.style
                        }}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {item.message || item.error ? (
                        <span style={styles.errorText}>
                          {item.message || item.error}
                        </span>
                      ) : (
                        "No validation message"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}