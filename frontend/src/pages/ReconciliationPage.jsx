import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReconciliation } from "../api/migrationApi";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export default function ReconciliationPage() {
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReconciliation = async () => {
      try {
        const migration = sessionStorage.getItem("migrationResult");

        if (!migration) {
          setError("No migration run found.");
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(migration);
        const runId = parsed.run_id || parsed.id;

        if (!runId) {
          setError("Migration run ID is missing.");
          setLoading(false);
          return;
        }

        const response = await getReconciliation(runId);
        setResult(response);
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load reconciliation."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReconciliation();
  }, []);

  const source =
    result?.source_count ??
    result?.sourceCount ??
    result?.source_total ??
    0;

  const accepted =
    result?.accepted_count ??
    result?.acceptedCount ??
    0;

  const rejected =
    result?.rejected_count ??
    result?.rejectedCount ??
    0;

  const target =
    result?.target_count ??
    result?.targetCount ??
    result?.target_total ??
    0;

  const balanced =
    result?.balanced ??
    result?.is_balanced ??
    target === accepted;

  if (loading) {
    return (
      <div className="center-state full-page-state">
        <Loader />
        <p>Loading reconciliation...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">RECONCILIATION</span>
          <h1>Reconciliation</h1>
          <p>
            Compare source, accepted, rejected, and target record totals.
          </p>
        </div>

        <Button variant="secondary" onClick={() => navigate("/migration")}>
          Back to Migration
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {result && (
        <>
          <section className="content-card reconciliation-status">
            <div>
              <span className="page-eyebrow">FINAL CHECK</span>
              <h2>Migration Reconciliation</h2>
              <p>
                Target records should match the number of accepted records.
              </p>
            </div>

            <Badge variant={balanced ? "success" : "danger"}>
              {balanced ? "Balanced" : "Mismatch"}
            </Badge>
          </section>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Source Records</span>
              <strong>{source}</strong>
            </div>

            <div className="stat-card success">
              <span>Accepted</span>
              <strong>{accepted}</strong>
            </div>

            <div className="stat-card danger">
              <span>Rejected</span>
              <strong>{rejected}</strong>
            </div>

            <div
              className={`stat-card ${
                balanced ? "success" : "danger"
              }`}
            >
              <span>Target Records</span>
              <strong>{target}</strong>
            </div>
          </div>

          <section className="content-card">
            <div className="card-header">
              <div>
                <h2>Count Comparison</h2>
                <p>Deterministic reconciliation results.</p>
              </div>
            </div>

            <div className="comparison-list">
              <div className="comparison-row">
                <span>Source → Accepted</span>
                <strong>
                  {source} → {accepted}
                </strong>
              </div>

              <div className="comparison-row">
                <span>Accepted → Target</span>
                <strong>
                  {accepted} → {target}
                </strong>
              </div>

              <div className="comparison-row">
                <span>Rejected</span>
                <strong>{rejected}</strong>
              </div>

              <div className="comparison-row total">
                <span>Result</span>
                <Badge variant={balanced ? "success" : "danger"}>
                  {balanced ? "Counts Match" : "Counts Do Not Match"}
                </Badge>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="bottom-actions">
        <Button onClick={() => navigate("/history")}>
          View Execution History
        </Button>
      </div>
    </div>
  );
}