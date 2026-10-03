import React, { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "medium",
  closeOnOverlay = true,
  showClose = true,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showClose) {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, showClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && closeOnOverlay) {
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div
        className={`modal-container modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-heading">
            {title && <h2 id="modal-title">{title}</h2>}
          </div>

          {showClose && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          background: rgba(15, 23, 42, 0.52);
          backdrop-filter: blur(3px);
          animation: modalOverlayIn 0.16s ease-out;
        }

        .modal-container {
          width: 100%;
          max-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow:
            0 24px 60px rgba(15, 23, 42, 0.18),
            0 8px 24px rgba(15, 23, 42, 0.08);
          animation: modalContainerIn 0.18s ease-out;
        }

        .modal-small {
          max-width: 420px;
        }

        .modal-medium {
          max-width: 600px;
        }

        .modal-large {
          max-width: 820px;
        }

        .modal-xl {
          max-width: 1100px;
        }

        .modal-full {
          max-width: 1400px;
          height: calc(100vh - 48px);
        }

        .modal-header {
          min-height: 64px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #eef0f3;
          background: #ffffff;
        }

        .modal-heading {
          min-width: 0;
        }

        .modal-heading h2 {
          margin: 0;
          color: #111827;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.4;
          letter-spacing: -0.01em;
        }

        .modal-close {
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          transition:
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease;
        }

        .modal-close:hover {
          background: #f3f4f6;
          border-color: #e5e7eb;
          color: #111827;
        }

        .modal-close:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
        }

        .modal-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 20px;
          color: #374151;
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }

        .modal-body::-webkit-scrollbar {
          width: 7px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-body::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #d1d5db;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          min-height: 68px;
          box-sizing: border-box;
          padding: 14px 20px;
          border-top: 1px solid #eef0f3;
          background: #fafafa;
        }

        @keyframes modalOverlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes modalContainerIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .modal-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .modal-container,
          .modal-small,
          .modal-medium,
          .modal-large,
          .modal-xl,
          .modal-full {
            max-width: none;
            max-height: 92vh;
            border-radius: 18px 18px 0 0;
          }

          .modal-header {
            padding: 14px 16px;
          }

          .modal-body {
            padding: 16px;
          }

          .modal-footer {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}