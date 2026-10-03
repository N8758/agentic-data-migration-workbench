import React from "react";

export default function Badge({
  children,
  variant = "neutral",
  size = "medium",
  dot = false,
  className = "",
}) {
  const classes = [
    "app-badge",
    `app-badge-${variant}`,
    `app-badge-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <span className={classes}>
        {dot && <span className="badge-dot" />}
        {children}
      </span>

      <style>{`
        .app-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 999px;
          font-weight: 600;
          white-space: nowrap;
          line-height: 1;
        }

        .app-badge-small {
          min-height: 22px;
          padding: 0 8px;
          font-size: 10px;
        }

        .app-badge-medium {
          min-height: 26px;
          padding: 0 10px;
          font-size: 11px;
        }

        .app-badge-large {
          min-height: 30px;
          padding: 0 12px;
          font-size: 12px;
        }

        .app-badge-neutral {
          background: #f3f4f6;
          color: #4b5563;
        }

        .app-badge-primary {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .app-badge-success {
          background: #ecfdf3;
          color: #15803d;
        }

        .app-badge-warning {
          background: #fffbeb;
          color: #b45309;
        }

        .app-badge-danger {
          background: #fef2f2;
          color: #b91c1c;
        }

        .app-badge-info {
          background: #ecfeff;
          color: #0e7490;
        }

        .app-badge-purple {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
      `}</style>
    </>
  );
}