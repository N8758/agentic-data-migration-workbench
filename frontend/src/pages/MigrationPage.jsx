import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMigration } from "../hooks/useMigration";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export default function MigrationPage() {
  const navigate = useNavigate();

  const {
    loading,
    error,
    execute,
    retry,
    rollback,
  } = useMigration();

  const [migration, setMigration] = useState(null);
  const [message, setMessage] = useState("");
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    // Load previous migration result
    const savedMigration = sessionStorage.getItem("migrationResult");

    if (savedMigration) {
      try {
        setMigration(JSON.parse(savedMigration));
      } catch {
        sessionStorage.removeItem("migrationResult");
      }
    }

    // Try to get plan_id directly
    const savedPlanId = sessionStorage.getItem("migrationPlanId");

    if (savedPlanId) {
      setPlanId(savedPlanId);
      return;
    }

    // Try to get plan_id from saved dry-run result
    const savedDryRun = sessionStorage.getItem("dryRunResult");

    if (savedDryRun) {
      try {
        const dryRunResult = JSON.parse(savedDryRun);

        const id =
          dryRunResult?.plan_id ||
          dryRunResult?.planId ||
          dryRunResult?.plan?.id;

        if (id) {
          setPlanId(id);
          sessionStorage.setItem("migrationPlanId", id);
        }
      } catch {
        console.error("Invalid dry-run result in sessionStorage");
      }
    }
  }, []);

  const handleExecute = async () => {
    setMessage("");

    if (!planId) {
      setMessage(
        "Migration plan ID is missing. Please run the dry run again and create an approved migration plan."
      );
      return;
    }

    try {
      console.log("Executing migration with plan_id:", planId);

      const response = await execute({
        plan_id: planId,
      });

      setMigration(response);

      sessionStorage.setItem(
        "migrationResult",
        JSON.stringify(response)
      );

      setMessage("Migration completed successfully.");
    } catch (err) {
      console.error("Migration execution failed:", err);
      setMessage("");
    }
  };

  const handleRetry = async () => {
    if (!migration?.id) return;

    try {
      const response = await retry(migration.id);

      setMigration(response);

      sessionStorage.setItem(
        "migrationResult",
        JSON.stringify(response)
      );

      setMessage("Migration retry completed.");
    } catch (err) {
      console.error("Migration retry failed:", err);
      setMessage("");
    }
  };

  const handleRollback = async () => {
    if (!migration?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to rollback this migration?"
    );

    if (!confirmed) return;

    try {
      const response = await rollback(migration.id);

      setMigration(response);

      sessionStorage.setItem(
        "migrationResult",
        JSON.stringify(response)
      );

      setMessage("Migration rollback completed.");
    } catch (err) {
      console.error("Migration rollback failed:", err);
      setMessage("");
    }
  };

  const status =
    migration?.status ||
    migration?.migration_status ||
    "Not Executed";

  const sourceCount =
    migration?.source_count ??
    migration?.sourceCount ??
    0;

  const acceptedCount =
    migration?.accepted_count ??
    migration?.acceptedCount ??
    0;

  const rejectedCount =
    migration?.rejected_count ??
    migration?.rejectedCount ??
    0;

  const targetCount =
    migration?.target_count ??
    migration?.targetCount ??
    0;

  const normalizedStatus = String(status).toLowerCase();

  const statusVariant =
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("success")
      ? "success"
      : normalizedStatus.includes("fail")
      ? "danger"
      : normalizedStatus.includes("rollback")
      ? "warning"
      : "info";

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">EXECUTION</span>

          <h1>Migration</h1>

          <p>
            Execute the approved migration and monitor its result.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate("/dry-run")}
        >
          Back to Dry Run
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {message && (
        <div
          className={
            message.toLowerCase().includes("missing")
              ? "error-message"
              : "success-message"
          }
        >
          {message}
        </div>
      )}

      <section className="content-card approval-card">
        <div className="card-header">
          <div>
            <h2>Migration Approval</h2>

            <p>
              Only an approved migration plan should be executed.
            </p>
          </div>

          <Badge variant={statusVariant}>
            {status}
          </Badge>
        </div>

        <div className="approval-warning">
          <strong>Execution control</strong>

          <span>
            The migration writes accepted records into the mock target
            store. Verify the dry-run results before execution.
          </span>
        </div>

        <div className="button-row">
          <Button
  onClick={() => {
    console.log("🔥 EXECUTE BUTTON CLICKED");
    console.log("🔥 planId:", planId);
    console.log("🔥 loading:", loading);
    handleExecute();
  }}
>
  Execute Migration
</Button>

          {migration?.id && (
            <>
              <Button
                variant="secondary"
                onClick={handleRetry}
                disabled={loading}
              >
                Retry
              </Button>

              <Button
                variant="danger"
                onClick={handleRollback}
                disabled={loading}
              >
                Rollback
              </Button>
            </>
          )}
        </div>

        <div style={{ marginTop: "12px", fontSize: "13px" }}>
          <strong>Plan ID:</strong>{" "}
          {planId || "Not available"}
        </div>
      </section>

      {loading && (
        <div className="center-state">
          <Loader />

          <p>Processing migration...</p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <span>Source</span>
          <strong>{sourceCount}</strong>
        </div>

        <div className="stat-card success">
          <span>Accepted</span>
          <strong>{acceptedCount}</strong>
        </div>

        <div className="stat-card danger">
          <span>Rejected</span>
          <strong>{rejectedCount}</strong>
        </div>

        <div className="stat-card">
          <span>Target</span>
          <strong>{targetCount}</strong>
        </div>
      </div>

      {migration && (
        <section className="content-card">
          <div className="card-header">
            <div>
              <h2>Execution Details</h2>

              <p>
                Latest migration execution information.
              </p>
            </div>
          </div>

          <div className="details-grid">
            <div>
              <span>Migration ID</span>

              <strong>
                {migration.id || "-"}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong>
                {status}
              </strong>
            </div>

            <div>
              <span>Created</span>

              <strong>
                {migration.created_at
                  ? new Date(
                      migration.created_at
                    ).toLocaleString()
                  : "-"}
              </strong>
            </div>

            <div>
              <span>Completed</span>

              <strong>
                {migration.completed_at
                  ? new Date(
                      migration.completed_at
                    ).toLocaleString()
                  : "-"}
              </strong>
            </div>
          </div>
        </section>
      )}

      <div className="bottom-actions">
        <Button
          variant="secondary"
          onClick={() => navigate("/reconciliation")}
        >
          View Reconciliation
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate("/history")}
        >
          View History
        </Button>
      </div>
    </div>
  );
}