import React, { useEffect, useState } from "react";

const navigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "▦",
    path: "/",
  },
  {
    id: "dataset",
    label: "Dataset",
    icon: "◫",
    path: "/dataset",
  },
  {
    id: "mapping",
    label: "Field Mapping",
    icon: "⇄",
    path: "/mapping",
  },
  {
    id: "dry-run",
    label: "Dry Run",
    icon: "▷",
    path: "/dry-run",
  },
  {
    id: "migration",
    label: "Migration",
    icon: "⇥",
    path: "/migration",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: "✓",
    path: "/reconciliation",
  },
  {
    id: "history",
    label: "History",
    icon: "◷",
    path: "/history",
  },
];

function getCurrentPath() {
  return window.location.pathname;
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(getCurrentPath());

  useEffect(() => {
    const toggle = () => setOpen((value) => !value);

    window.addEventListener("toggle-sidebar", toggle);

    const handleNavigation = () => {
      setCurrentPath(getCurrentPath());
      setOpen(false);
    };

    window.addEventListener("popstate", handleNavigation);

    return () => {
      window.removeEventListener("toggle-sidebar", toggle);
      window.removeEventListener("popstate", handleNavigation);
    };
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const isActive = (path) => {
    if (path === "/") {
      return currentPath === "/";
    }

    return currentPath.startsWith(path);
  };

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <span>MW</span>
          </div>

          <div>
            <div className="brand-name">Migration</div>
            <div className="brand-subtitle">Workbench</div>
          </div>

          <button
            className="sidebar-close"
            type="button"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                isActive(item.path) ? "nav-item-active" : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {isActive(item.path) && (
                <span className="active-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="agent-card">
            <div className="agent-card-header">
              <div className="agent-icon">✦</div>
              <span>AI Agent</span>
              <span className="agent-online">ONLINE</span>
            </div>

            <p>
              Mapping assistant is ready to analyze your migration.
            </p>
          </div>

          <div className="sidebar-footer">
            <span>Migration Workbench</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          background: #111827;
          color: #d1d5db;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 200;
          border-right: 1px solid #1f2937;
        }

        .sidebar-brand {
          height: 72px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #1f2937;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .brand-name {
          color: white;
          font-size: 14px;
          font-weight: 700;
        }

        .brand-subtitle {
          color: #9ca3af;
          font-size: 11px;
          margin-top: 2px;
        }

        .sidebar-close {
          display: none;
          margin-left: auto;
          background: transparent;
          border: 0;
          color: #9ca3af;
          font-size: 25px;
          cursor: pointer;
        }

        .sidebar-section-title {
          padding: 26px 20px 10px;
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 12px;
        }

        .nav-item {
          position: relative;
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 13px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .nav-item:hover {
          background: #1f2937;
          color: #f3f4f6;
        }

        .nav-item-active {
          background: #1e3a5f;
          color: white;
        }

        .nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
          color: currentColor;
        }

        .active-indicator {
          position: absolute;
          right: 7px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #60a5fa;
        }

        .sidebar-bottom {
          margin-top: auto;
          padding: 16px;
        }

        .agent-card {
          padding: 14px;
          border: 1px solid #263244;
          border-radius: 12px;
          background: #172033;
        }

        .agent-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f3f4f6;
          font-size: 12px;
          font-weight: 600;
        }

        .agent-icon {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .agent-online {
          margin-left: auto;
          color: #4ade80;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .agent-card p {
          margin: 10px 0 0;
          color: #9ca3af;
          font-size: 10px;
          line-height: 1.5;
        }

        .sidebar-footer {
          display: flex;
          justify-content: space-between;
          padding: 18px 2px 2px;
          color: #4b5563;
          font-size: 9px;
        }

        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 20px 0 50px rgba(0, 0, 0, 0.2);
          }

          .sidebar-open {
            transform: translateX(0);
          }

          .sidebar-close {
            display: block;
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 150;
          }
        }
      `}</style>
    </>
  );
}