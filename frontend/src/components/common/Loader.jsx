import React from "react";

export default function Loader({
  size = "medium",
  text = "",
  fullPage = false,
}) {
  const content = (
    <div className={`app-loader app-loader-${size}`}>
      <div className="loader-spinner">
        <span />
        <span />
        <span />
      </div>

      {text && <div className="loader-text">{text}</div>}

      <style>{`
        .app-loader {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #6b7280;
        }

        .app-loader-small .loader-spinner {
          width: 18px;
          height: 18px;
        }

        .app-loader-medium .loader-spinner {
          width: 28px;
          height: 28px;
        }

        .app-loader-large .loader-spinner {
          width: 42px;
          height: 42px;
        }

        .loader-spinner {
          position: relative;
          display: inline-block;
        }

        .loader-spinner span {
          position: absolute;
          width: 25%;
          height: 25%;
          border-radius: 50%;
          background: #2563eb;
          animation: loaderPulse 1s infinite ease-in-out;
        }

        .loader-spinner span:nth-child(1) {
          top: 0;
          left: 37.5%;
          animation-delay: 0s;
        }

        .loader-spinner span:nth-child(2) {
          right: 0;
          bottom: 0;
          animation-delay: 0.18s;
        }

        .loader-spinner span:nth-child(3) {
          left: 0;
          bottom: 0;
          animation-delay: 0.36s;
        }

        .loader-text {
          color: #4b5563;
          font-size: 13px;
          font-weight: 500;
        }

        @keyframes loaderPulse {
          0%,
          100% {
            transform: scale(0.65);
            opacity: 0.35;
          }

          50% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .loader-full-page {
          min-height: 320px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return <div className="loader-full-page">{content}</div>;
  }

  return content;
}