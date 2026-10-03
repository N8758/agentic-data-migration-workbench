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
    gap: "15px",
    marginBottom: "20px",
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
    display: "inline-flex",
    padding: "6px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700
  },
  accepted: {
    background: "#dcfce7",
    color: "#166534"
  },
  rejected: {
    background: "#fee2e2",
    color: "#991b1b"
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
    minWidth: "850px"
  },
  th: {
    textAlign: "left",
    padding: "13px 15px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase"
  },
  td: {
    padding: "14px 15px",
    borderBottom: "1px solid #f1f5f9",
    color: "#374151",
    fontSize: "13px",
    verticalAlign: "top"
  },
  json: {
    margin: 0,
    padding: "12px",
    background: "#111827",
    color: "#e5e7eb",
    borderRadius: "8px",
    fontSize: "11px",
    lineHeight: 1.5,
    maxWidth: "500px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  empty: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px"
  }
};

function formatRecord(record) {
  if (record === null || record === undefined) {
    return "—";
  }

  if (typeof record === "object") {
    return JSON.stringify(record, null, 2);
  }

  return String(record);
}

function getStatus(record) {
  if (
    record.valid === true ||
    record.status === "accepted" ||
    record.status === "valid"
  ) {
    return {
      label: "Accepted",
      style: styles.accepted
    };
  }

  return {
    label: "Rejected",
    style: styles.rejected
  };
}

export default function RecordPreview({
  records = [],
  sourceRecords = [],
  transformedRecords = [],
  limit = 20
}) {
  let items = [];

  if (Array.isArray(records) && records.length) {
    items = records;
  } else if (Array.isArray(transformedRecords) && transformedRecords.length) {
    items = transformedRecords;
  } else if (Array.isArray(sourceRecords)) {
    items = sourceRecords;
  }

  const visibleRecords = items.slice(0, limit);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Record Preview</h2>
          <p style={styles.subtitle}>
            Preview of records produced by the deterministic dry run.
          </p>
        </div>

        <span style={styles.badge}>
          Showing {visibleRecords.length} of {items.length}
        </span>
      </div>

      {!visibleRecords.length ? (
        <div style={styles.empty}>
          No records available for preview.
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Record ID</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Source Data</th>
                <th style={styles.th}>Transformed Data</th>
                <th style={styles.th}>Error</th>
              </tr>
            </thead>

            <tbody>
              {visibleRecords.map((record, index) => {
                const status = getStatus(record);

                const source =
                  record.source ||
                  record.source_data ||
                  record.source_record ||
                  record;

                const transformed =
                  record.transformed ||
                  record.transformed_data ||
                  record.target ||
                  record.target_data ||
                  null;

                const error =
                  record.error ||
                  record.validation_error ||
                  record.message ||
                  "";

                return (
                  <tr key={record.id ?? record.record_id ?? index}>
                    <td style={styles.td}>
                      {record.record_id ??
                        record.source_id ??
                        record.id ??
                        index + 1}
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
                      <pre style={styles.json}>
                        {formatRecord(source)}
                      </pre>
                    </td>

                    <td style={styles.td}>
                      <pre style={styles.json}>
                        {formatRecord(transformed)}
                      </pre>
                    </td>

                    <td style={styles.td}>
                      {error || "—"}
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