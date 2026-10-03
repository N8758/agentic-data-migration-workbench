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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "14px",
    marginBottom: "20px"
  },
  item: {
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
    marginTop: "7px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#111827"
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  button: {
    border: 0,
    borderRadius: "10px",
    padding: "11px 18px",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer"
  },
  approve: {
    background: "#16a34a",
    color: "#fff"
  },
  reject: {
    background: "#dc2626",
    color: "#fff"
  },
  disabled: {
    opacity: 0.55,
    cursor: "not-allowed"
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "13px",
    outline: "none",
    marginBottom: "14px"
  },
  message: {
    marginTop: "14px",
    padding: "10px 12px",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px"
  }
};

export default function ApprovalPanel({
  plan = null,
  loading = false,
  onApprove,
  onReject
}) {
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("");

  const status = plan?.status || "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const disabled = loading || isApproved || isRejected;

  const handleApprove = async () => {
    setAction("approve");

    try {
      if (onApprove) {
        await onApprove(plan?.id);
      }
    } finally {
      setAction("");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setAction("reason");
      return;
    }

    setAction("reject");

    try {
      if (onReject) {
        await onReject(plan?.id, reason.trim());
      }
    } finally {
      setAction("");
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Migration Approval</h2>

      <p style={styles.subtitle}>
        Review the proposed migration plan before execution.
      </p>

      <div style={styles.grid}>
        <div style={styles.item}>
          <div style={styles.label}>Plan ID</div>
          <div style={styles.value}>{plan?.id || "Not created"}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Version</div>
          <div style={styles.value}>
            {plan?.version ?? "—"}
          </div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Status</div>
          <div style={styles.value}>
            {status}
          </div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Mappings</div>
          <div style={styles.value}>
            {plan?.mappings?.length ?? plan?.field_mappings?.length ?? 0}
          </div>
        </div>
      </div>

      {!isApproved && !isRejected && (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional approval note or required rejection reason..."
            style={styles.textarea}
          />

          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleApprove}
              disabled={disabled}
              style={{
                ...styles.button,
                ...styles.approve,
                ...(disabled ? styles.disabled : {})
              }}
            >
              {action === "approve" ? "Approving..." : "Approve Plan"}
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={disabled}
              style={{
                ...styles.button,
                ...styles.reject,
                ...(disabled ? styles.disabled : {})
              }}
            >
              {action === "reject" ? "Rejecting..." : "Reject Plan"}
            </button>
          </div>

          {action === "reason" && (
            <div style={styles.message}>
              Please provide a reason before rejecting the plan.
            </div>
          )}
        </>
      )}

      {isApproved && (
        <div style={styles.message}>
          This migration plan has been approved and is ready for execution.
        </div>
      )}

      {isRejected && (
        <div style={styles.message}>
          This migration plan has been rejected.
        </div>
      )}
    </div>
  );
}