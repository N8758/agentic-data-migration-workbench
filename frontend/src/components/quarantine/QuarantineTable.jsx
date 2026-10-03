import React, { useState } from "react";

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
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px"
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
  count: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "34px",
    height: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: 700
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
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.03em"
  },
  td: {
    padding: "14px 15px",
    borderBottom: "1px solid #f1f5f9",
    color: "#374151",
    fontSize: "13px",
    verticalAlign: "top"
  },
  id: {
    fontWeight: 700,
    color: "#111827"
  },
  badge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700
  },
  rejected: {
    background: "#fee2e2",
    color: "#991b1b"
  },
  warning: {
    background: "#fef3c7",
    color: "#92400e"
  },
  error: {
    color: "#b91c1c",
    maxWidth: "350px",
    lineHeight: 1.5
  },
  button: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    borderRadius: "8px",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer"
  },
  empty: {
    padding: "35px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px"
  },
  search: {
    width: "240px",
    maxWidth: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    padding: "9px 12px",
    outline: "none",
    fontSize: "13px"
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  }
};

function getErrorMessage(item) {
  return (
    item.error ||
    item.error_message ||
    item.validation_error ||
    item.message ||
    "Validation failed"
  );
}

function getStatus(item) {
  const status = String(item.status || "").toLowerCase();

  if (status === "warning") {
    return {
      label: "Warning",
      style: styles.warning
    };
  }

  return {
    label: "Quarantined",
    style: styles.rejected
  };
}

export default function QuarantineTable({
  records = [],
  items = [],
  onSelect
}) {
  const [search, setSearch] = useState("");

  const sourceRecords =
    Array.isArray(records) && records.length
      ? records
      : Array.isArray(items)
      ? items
      : [];

  const filteredRecords = sourceRecords.filter((item) => {
    const text = JSON.stringify(item).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Quarantined Records</h2>
          <p style={styles.subtitle}>
            Records rejected during deterministic migration validation.
          </p>
        </div>

        <div style={styles.controls}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            style={styles.search}
          />

          <span style={styles.count}>
            {filteredRecords.length}
          </span>
        </div>
      </div>

      {!filteredRecords.length ? (
        <div style={styles.empty}>
          {sourceRecords.length
            ? "No records match your search."
            : "No quarantined records found."}
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Record ID</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Field</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((item, index) => {
                const status = getStatus(item);

                return (
                  <tr key={item.id ?? item.record_id ?? index}>
                    <td style={styles.td}>
                      <span style={styles.id}>
                        {item.record_id ??
                          item.source_id ??
                          item.id ??
                          index + 1}
                      </span>
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
                      {item.field ||
                        item.field_name ||
                        item.failed_field ||
                        "—"}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.error}>
                        {getErrorMessage(item)}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.button}
                        onClick={() => {
                          if (onSelect) {
                            onSelect(item);
                          }
                        }}
                      >
                        View Details
                      </button>
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