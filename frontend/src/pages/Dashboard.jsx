import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as schemaApi from "../api/schemaApi";
import * as planApi from "../api/planApi";

export default function Dashboard() {
  const [sourceSchema, setSourceSchema] = useState(null);
  const [targetSchema, setTargetSchema] = useState(null);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError("");

      if (!loading) {
        setRefreshing(true);
      }

      const results = await Promise.allSettled([
        schemaApi.getSourceSchema(),
        schemaApi.getTargetSchema(),
        planApi.getPlans(),
      ]);

      // -----------------------------
      // SOURCE SCHEMA
      // -----------------------------
      if (results[0].status === "fulfilled") {
        const response = results[0].value;
        setSourceSchema(response?.data ?? response);
      } else {
        console.warn("Source schema API failed:", results[0].reason);
      }

      // -----------------------------
      // TARGET SCHEMA
      // -----------------------------
      if (results[1].status === "fulfilled") {
        const response = results[1].value;
        setTargetSchema(response?.data ?? response);
      } else {
        console.warn("Target schema API failed:", results[1].reason);
      }

      // -----------------------------
      // MIGRATION PLANS
      // -----------------------------
      if (results[2].status === "fulfilled") {
        const response = results[2].value;
        const data = response?.data ?? response;

        if (Array.isArray(data)) {
          setPlans(data);
        } else if (Array.isArray(data?.items)) {
          setPlans(data.items);
        } else {
          setPlans([]);
        }
      } else {
        console.warn("Plans API failed:", results[2].reason);
      }

      // Show warning only if all APIs failed
      const allFailed = results.every(
        (result) => result.status === "rejected"
      );

      if (allFailed) {
        setError(
          "Backend APIs are not available. Dashboard UI is still running."
        );
      }
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --------------------------------
  // FIELD COUNT HELPER
  // --------------------------------
  const getFieldCount = (schema) => {
    if (!schema) return 0;

    if (Array.isArray(schema)) {
      return schema.length;
    }

    if (Array.isArray(schema.fields)) {
      return schema.fields.length;
    }

    if (
      schema.properties &&
      typeof schema.properties === "object"
    ) {
      return Object.keys(schema.properties).length;
    }

    return 0;
  };

  const latestPlan = plans.length > 0 ? plans[0] : null;

  // --------------------------------
  // LOADING SCREEN
  // --------------------------------
  if (loading) {
    return (
      <>
        <div className="dashboard-page">
          <div className="dashboard-loading">
            <div className="loading-spinner" />

            <h2>Loading Migration Workbench</h2>

            <p>
              Preparing your migration workspace...
            </p>
          </div>
        </div>

        <DashboardStyles />
      </>
    );
  }

  // --------------------------------
  // MAIN DASHBOARD
  // --------------------------------
  return (
    <>
      <div className="dashboard-page">

        {/* HEADER */}
        <div className="dashboard-header">
          <div>
            <div className="eyebrow">
              Migration Workbench
            </div>

            <h1>
              Migration Dashboard
            </h1>

            <p>
              Plan, validate, execute, and reconcile
              your bounded data migration.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <span className={refreshing ? "spin" : ""}>
              ↻
            </span>

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ERROR / WARNING */}
        {error && (
          <div className="dashboard-error">
            <div className="error-icon">
              !
            </div>

            <div>
              <strong>
                Backend connection notice
              </strong>

              <span>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon source-icon">
              S
            </div>

            <div>
              <span className="stat-label">
                Source Fields
              </span>

              <strong>
                {getFieldCount(sourceSchema)}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon target-icon">
              T
            </div>

            <div>
              <span className="stat-label">
                Target Fields
              </span>

              <strong>
                {getFieldCount(targetSchema)}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon plan-icon">
              P
            </div>

            <div>
              <span className="stat-label">
                Migration Plans
              </span>

              <strong>
                {plans.length}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon status-icon">
              ✓
            </div>

            <div>
              <span className="stat-label">
                Workspace Status
              </span>

              <strong>
                Ready
              </strong>
            </div>
          </div>

        </div>

        {/* WORKFLOW + PLAN */}
        <div className="dashboard-grid">

          {/* WORKFLOW */}
          <section className="dashboard-card">

            <div className="card-header">
              <div>
                <h2>
                  Migration Workflow
                </h2>

                <p>
                  Follow the controlled migration lifecycle.
                </p>
              </div>
            </div>

            <div className="workflow-list">

              <Link
                to="/dataset"
                className="workflow-item"
              >
                <span className="workflow-number">
                  01
                </span>

                <div>
                  <strong>
                    Inspect Dataset
                  </strong>

                  <span>
                    Review source and target schemas.
                  </span>
                </div>

                <span className="workflow-arrow">
                  →
                </span>
              </Link>

              <Link
                to="/mapping"
                className="workflow-item"
              >
                <span className="workflow-number">
                  02
                </span>

                <div>
                  <strong>
                    Generate Mapping
                  </strong>

                  <span>
                    Use the AI agent to propose mappings.
                  </span>
                </div>

                <span className="workflow-arrow">
                  →
                </span>
              </Link>

              <Link
                to="/dry-run"
                className="workflow-item"
              >
                <span className="workflow-number">
                  03
                </span>

                <div>
                  <strong>
                    Dry Run
                  </strong>

                  <span>
                    Validate records before execution.
                  </span>
                </div>

                <span className="workflow-arrow">
                  →
                </span>
              </Link>

              <Link
                to="/migration"
                className="workflow-item"
              >
                <span className="workflow-number">
                  04
                </span>

                <div>
                  <strong>
                    Execute Migration
                  </strong>

                  <span>
                    Approve and execute the migration.
                  </span>
                </div>

                <span className="workflow-arrow">
                  →
                </span>
              </Link>

              <Link
                to="/reconciliation"
                className="workflow-item"
              >
                <span className="workflow-number">
                  05
                </span>

                <div>
                  <strong>
                    Reconcile
                  </strong>

                  <span>
                    Compare source and target results.
                  </span>
                </div>

                <span className="workflow-arrow">
                  →
                </span>
              </Link>

            </div>
          </section>

          {/* LATEST PLAN */}
          <section className="dashboard-card">

            <div className="card-header">
              <div>
                <h2>
                  Latest Plan
                </h2>

                <p>
                  Current migration plan status.
                </p>
              </div>
            </div>

            {latestPlan ? (
              <div className="latest-plan">

                <div className="plan-title">

                  <div className="plan-avatar">
                    MP
                  </div>

                  <div>
                    <strong>
                      {latestPlan.name ||
                        latestPlan.title ||
                        `Migration Plan #${latestPlan.id}`}
                    </strong>

                    <span>
                      Version {latestPlan.version || 1}
                    </span>
                  </div>

                </div>

                <div className="plan-details">

                  <div>
                    <span>
                      Status
                    </span>

                    <strong className="status-pill">
                      {latestPlan.status || "Draft"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Created
                    </span>

                    <strong>
                      {latestPlan.created_at
                        ? new Date(
                            latestPlan.created_at
                          ).toLocaleDateString()
                        : "—"}
                    </strong>
                  </div>

                </div>

                <Link
                  to="/mapping"
                  className="primary-link"
                >
                  Open Mapping
                  <span>
                    →
                  </span>
                </Link>

              </div>
            ) : (
              <div className="empty-plan">

                <div className="empty-icon">
                  +
                </div>

                <h3>
                  No migration plan yet
                </h3>

                <p>
                  Start by inspecting the dataset and
                  generating an AI-assisted migration plan.
                </p>

                <Link
                  to="/mapping"
                  className="primary-link"
                >
                  Create Migration Plan
                  <span>
                    →
                  </span>
                </Link>

              </div>
            )}

          </section>

        </div>

        {/* ARCHITECTURE */}
        <section className="dashboard-card architecture-card">

          <div className="card-header">
            <div>
              <h2>
                Migration Architecture
              </h2>

              <p>
                Controlled flow from source data to
                validated target data.
              </p>
            </div>
          </div>

          <div className="architecture-flow">

            <div className="architecture-node">
              <div className="node-symbol">
                S
              </div>

              <strong>
                Source
              </strong>

              <span>
                Schema + Records
              </span>
            </div>

            <div className="architecture-line" />

            <div className="architecture-node">
              <div className="node-symbol ai-node">
                AI
              </div>

              <strong>
                Agent
              </strong>

              <span>
                Mapping + Risks
              </span>
            </div>

            <div className="architecture-line" />

            <div className="architecture-node">
              <div className="node-symbol">
                ✓
              </div>

              <strong>
                Validation
              </strong>

              <span>
                Dry Run
              </span>
            </div>

            <div className="architecture-line" />

            <div className="architecture-node">
              <div className="node-symbol">
                T
              </div>

              <strong>
                Target
              </strong>

              <span>
                Mock Database
              </span>
            </div>

          </div>

        </section>

      </div>

      <DashboardStyles />
    </>
  );
}


/* =====================================================
   DASHBOARD STYLES
===================================================== */

function DashboardStyles() {
  return (
    <style>{`

      * {
        box-sizing: border-box;
      }

      .dashboard-page {
        width: 100%;
        min-height: 100%;
        padding: 28px;
        background: #f8fafc;
        color: #111827;
      }

      .dashboard-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 26px;
      }

      .eyebrow {
        margin-bottom: 7px;
        color: #2563eb;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .08em;
      }

      .dashboard-header h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
        letter-spacing: -.03em;
      }

      .dashboard-header p {
        margin: 8px 0 0;
        color: #64748b;
        font-size: 14px;
      }

      .refresh-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid #dbe2ea;
        border-radius: 9px;
        background: white;
        color: #374151;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .refresh-button:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .refresh-button:disabled {
        opacity: .65;
        cursor: not-allowed;
      }

      .refresh-button span {
        font-size: 17px;
      }

      .spin {
        animation: dashboardSpin .8s linear infinite;
      }

      .dashboard-error {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
        padding: 13px 15px;
        border: 1px solid #fed7aa;
        border-radius: 10px;
        background: #fff7ed;
        color: #9a3412;
        font-size: 12px;
      }

      .dashboard-error strong,
      .dashboard-error span {
        display: block;
      }

      .dashboard-error span {
        margin-top: 3px;
      }

      .error-icon {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 30px;
        border-radius: 50%;
        background: #ffedd5;
        font-weight: 800;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .stat-card,
      .dashboard-card {
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: white;
        box-shadow: 0 1px 2px rgba(15, 23, 42, .03);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px;
      }

      .stat-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 42px;
        border-radius: 11px;
        font-size: 14px;
        font-weight: 800;
      }

      .source-icon {
        background: #eff6ff;
        color: #2563eb;
      }

      .target-icon {
        background: #ecfdf5;
        color: #059669;
      }

      .plan-icon {
        background: #f5f3ff;
        color: #7c3aed;
      }

      .status-icon {
        background: #ecfdf3;
        color: #15803d;
      }

      .stat-label {
        display: block;
        margin-bottom: 4px;
        color: #64748b;
        font-size: 11px;
        font-weight: 600;
      }

      .stat-card strong {
        color: #111827;
        font-size: 20px;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        gap: 15px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid #f1f5f9;
      }

      .card-header h2 {
        margin: 0;
        font-size: 15px;
      }

      .card-header p {
        margin: 5px 0 0;
        color: #64748b;
        font-size: 12px;
      }

      .workflow-list {
        padding: 7px 10px 10px;
      }

      .workflow-item {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 13px 10px;
        border-radius: 9px;
        color: inherit;
        text-decoration: none;
        transition: background .16s ease;
      }

      .workflow-item:hover {
        background: #f8fafc;
      }

      .workflow-number {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 30px;
        border-radius: 8px;
        background: #f1f5f9;
        color: #475569;
        font-size: 10px;
        font-weight: 800;
      }

      .workflow-item > div {
        flex: 1;
        min-width: 0;
      }

      .workflow-item strong {
        display: block;
        margin-bottom: 3px;
        font-size: 13px;
      }

      .workflow-item div span {
        display: block;
        color: #64748b;
        font-size: 11px;
      }

      .workflow-arrow {
        color: #94a3b8;
        font-size: 17px;
      }

      .latest-plan {
        padding: 20px;
      }

      .plan-title {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 18px;
        border-bottom: 1px solid #f1f5f9;
      }

      .plan-avatar {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: #eff6ff;
        color: #2563eb;
        font-size: 11px;
        font-weight: 800;
      }

      .plan-title strong,
      .plan-title span {
        display: block;
      }

      .plan-title strong {
        font-size: 13px;
      }

      .plan-title span {
        margin-top: 4px;
        color: #64748b;
        font-size: 11px;
      }

      .plan-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        padding: 18px 0;
      }

      .plan-details span,
      .plan-details strong {
        display: block;
      }

      .plan-details span {
        margin-bottom: 5px;
        color: #94a3b8;
        font-size: 10px;
        text-transform: uppercase;
        font-weight: 700;
      }

      .plan-details strong {
        font-size: 12px;
      }

      .status-pill {
        display: inline-flex !important;
        width: fit-content;
        padding: 5px 8px;
        border-radius: 999px;
        background: #eff6ff;
        color: #2563eb;
      }

      .primary-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 39px;
        padding: 0 14px;
        border-radius: 9px;
        background: #2563eb;
        color: white;
        text-decoration: none;
        font-size: 12px;
        font-weight: 700;
      }

      .primary-link:hover {
        background: #1d4ed8;
      }

      .empty-plan {
        padding: 32px 24px;
        text-align: center;
      }

      .empty-icon {
        width: 42px;
        height: 42px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #eff6ff;
        color: #2563eb;
        font-size: 24px;
      }

      .empty-plan h3 {
        margin: 0;
        font-size: 14px;
      }

      .empty-plan p {
        margin: 7px auto 18px;
        max-width: 300px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.55;
      }

      .architecture-card {
        margin-bottom: 20px;
      }

      .architecture-flow {
        display: flex;
        align-items: center;
        padding: 25px;
      }

      .architecture-node {
        flex: 1;
        text-align: center;
      }

      .node-symbol {
        width: 44px;
        height: 44px;
        margin: 0 auto 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: #eff6ff;
        color: #2563eb;
        font-size: 12px;
        font-weight: 800;
      }

      .ai-node {
        background: #f5f3ff;
        color: #7c3aed;
      }

      .architecture-node strong,
      .architecture-node span {
        display: block;
      }

      .architecture-node strong {
        font-size: 12px;
      }

      .architecture-node span {
        margin-top: 4px;
        color: #64748b;
        font-size: 10px;
      }

      .architecture-line {
        width: 70px;
        height: 1px;
        background: #cbd5e1;
      }

      .dashboard-loading {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: #64748b;
      }

      .dashboard-loading h2 {
        margin: 10px 0 0;
        color: #111827;
        font-size: 18px;
      }

      .dashboard-loading p {
        margin: 0;
        font-size: 13px;
      }

      .loading-spinner {
        width: 34px;
        height: 34px;
        border: 3px solid #dbeafe;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: dashboardSpin .8s linear infinite;
      }

      @keyframes dashboardSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1000px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 650px) {
        .dashboard-page {
          padding: 18px;
        }

        .dashboard-header {
          flex-direction: column;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .architecture-flow {
          flex-direction: column;
          gap: 15px;
        }

        .architecture-line {
          width: 1px;
          height: 30px;
        }
      }

    `}</style>
  );
}