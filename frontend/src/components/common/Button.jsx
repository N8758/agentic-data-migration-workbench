import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  onClick,
  className = "",
}) {
  const classes = [
    "app-button",
    `app-button-${variant}`,
    `app-button-${size}`,
    fullWidth ? "app-button-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type={type}
        className={classes}
        disabled={disabled || loading}
        onClick={onClick}
      >
        {loading ? (
          <span className="button-loader">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <>
            {icon && <span className="button-icon">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </button>

      <style>{`
        .app-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid transparent;
          border-radius: 9px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.12s ease;
          white-space: nowrap;
          user-select: none;
        }

        .app-button:not(:disabled):active {
          transform: translateY(1px);
        }

        .app-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        }

        .app-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .app-button-small {
          min-height: 34px;
          padding: 0 12px;
          font-size: 12px;
        }

        .app-button-medium {
          min-height: 40px;
          padding: 0 16px;
          font-size: 13px;
        }

        .app-button-large {
          min-height: 46px;
          padding: 0 20px;
          font-size: 14px;
        }

        .app-button-primary {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .app-button-primary:not(:disabled):hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .app-button-secondary {
          background: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .app-button-secondary:not(:disabled):hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .app-button-success {
          background: #15803d;
          border-color: #15803d;
          color: #ffffff;
        }

        .app-button-success:not(:disabled):hover {
          background: #166534;
          border-color: #166534;
          box-shadow: 0 4px 12px rgba(22, 101, 52, 0.18);
        }

        .app-button-danger {
          background: #dc2626;
          border-color: #dc2626;
          color: #ffffff;
        }

        .app-button-danger:not(:disabled):hover {
          background: #b91c1c;
          border-color: #b91c1c;
          box-shadow: 0 4px 12px rgba(185, 28, 28, 0.18);
        }

        .app-button-warning {
          background: #d97706;
          border-color: #d97706;
          color: #ffffff;
        }

        .app-button-warning:not(:disabled):hover {
          background: #b45309;
          border-color: #b45309;
        }

        .app-button-ghost {
          background: transparent;
          border-color: transparent;
          color: #4b5563;
        }

        .app-button-ghost:not(:disabled):hover {
          background: #f3f4f6;
          color: #111827;
        }

        .app-button-outline {
          background: transparent;
          border-color: #2563eb;
          color: #2563eb;
        }

        .app-button-outline:not(:disabled):hover {
          background: #eff6ff;
        }

        .app-button-full {
          width: 100%;
        }

        .button-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .button-loader {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .button-loader span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          animation: buttonLoading 0.8s infinite ease-in-out;
        }

        .button-loader span:nth-child(2) {
          animation-delay: 0.12s;
        }

        .button-loader span:nth-child(3) {
          animation-delay: 0.24s;
        }

        @keyframes buttonLoading {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
          }

          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}