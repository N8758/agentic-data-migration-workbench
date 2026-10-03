import React from "react";

export default function ErrorMessage({
  title = "Something went wrong",
  message = "Unable to complete the request. Please try again.",
  onRetry,
  retryText = "Try again",
  compact = false,
}) {
  return (
    <>
      <div className={`error-message ${compact ? "error-message-compact" : ""}`}>
        <div className="error-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="error-content">
          <div className="error-title">{title}</div>
          <div className="error-description">{message}</div>

          {onRetry && (
            <button type="button" className="error-retry" onClick={onRetry}>
              {retryText}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .error-message {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fff7f7;
          color: #991b1b;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .error-message-compact {
          padding: 12px 14px;
          gap: 10px;
          border-radius: 9px;
        }

        .error-icon {
          flex: 0 0 38px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #fee2e2;
          color: #dc2626;
        }

        .error-message-compact .error-icon {
          width: 30px;
          height: 30px;
          flex-basis: 30px;
          border-radius: 8px;
        }

        .error-content {
          min-width: 0;
          flex: 1;
        }

        .error-title {
          margin-bottom: 4px;
          color: #991b1b;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.4;
        }

        .error-description {
          color: #7f1d1d;
          font-size: 13px;
          line-height: 1.55;
          word-break: break-word;
        }

        .error-retry {
          margin-top: 12px;
          padding: 7px 12px;
          border: 1px solid #fca5a5;
          border-radius: 7px;
          background: #ffffff;
          color: #b91c1c;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .error-retry:hover {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .error-retry:active {
          transform: translateY(1px);
        }

        .error-retry:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
        }

        @media (max-width: 640px) {
          .error-message {
            padding: 14px;
          }

          .error-icon {
            width: 34px;
            height: 34px;
            flex-basis: 34px;
          }
        }
      `}</style>
    </>
  );
}