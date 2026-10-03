import React from "react";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Open navigation"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("toggle-sidebar"))
          }
        >
          ☰
        </button>

        <div className="navbar-title">
          <div className="navbar-title-main">Migration Workbench</div>
          <div className="navbar-title-sub">Data migration control center</div>
        </div>
      </div>

      <div className="navbar-right">
        <div className="system-status">
          <span className="status-dot" />
          <span>System Ready</span>
        </div>

        <div className="navbar-divider" />

        <div className="user-profile">
          <div className="user-avatar">NP</div>
          <div className="user-info">
            <span className="user-name">Nilesh Pulate</span>
            <span className="user-role">Developer</span>
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          height: 72px;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
        }

        .navbar-left,
        .navbar-right {
          display: flex;
          align-items: center;
        }

        .navbar-left {
          gap: 16px;
        }

        .navbar-title-main {
          color: #111827;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .navbar-title-sub {
          color: #6b7280;
          font-size: 12px;
          margin-top: 3px;
        }

        .navbar-right {
          gap: 18px;
        }

        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
        }

        .navbar-divider {
          width: 1px;
          height: 32px;
          background: #e5e7eb;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #111827;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          color: #111827;
          font-size: 13px;
          font-weight: 600;
        }

        .user-role {
          color: #6b7280;
          font-size: 11px;
        }

        .mobile-menu-button {
          display: none;
          width: 38px;
          height: 38px;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 0 16px;
          }

          .mobile-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .system-status,
          .navbar-divider,
          .user-info {
            display: none;
          }

          .navbar-right {
            gap: 0;
          }
        }
      `}</style>
    </header>
  );
}