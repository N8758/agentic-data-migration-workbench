import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useMigration } from "../hooks/useMigration";

import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export default function DryRunPage() {
  const navigate = useNavigate();

  const {
    loading,
    error,
    performDryRun,
  } = useMigration();

  const [result, setResult] = useState(null);
  const [planId, setPlanId] = useState("");

  // --------------------------------------------------
  // LOAD PLAN ID + PREVIOUS DRY RUN RESULT
  // --------------------------------------------------

  useEffect(() => {
    const savedPlanId =
      sessionStorage.getItem("migrationPlanId") ||
      sessionStorage.getItem("plan_id") ||
      localStorage.getItem("migrationPlanId") ||
      localStorage.getItem("plan_id");

    if (savedPlanId) {
      setPlanId(savedPlanId);
    }

    const savedResult = sessionStorage.getItem("dryRunResult");

    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch {
        sessionStorage.removeItem("dryRunResult");
      }
    }
  }, []);

  // --------------------------------------------------
  // RUN DRY RUN
  // --------------------------------------------------

  const handleRun = async () => {
    const currentPlanId =
      planId ||
      sessionStorage.getItem("migrationPlanId") ||
      sessionStorage.getItem("plan_id") ||
      localStorage.getItem("migrationPlanId") ||
      localStorage.getItem("plan_id");

    if (!currentPlanId) {
      alert(
        "Plan ID is missing. Please go back to Mapping and create/select a migration plan first."
      );

      navigate("/mapping");
      return;
    }

    // Keep state synchronized with the actual plan ID
    setPlanId(currentPlanId);

    try {
      // --------------------------------------------------
      // Backend requires plan_id
      // --------------------------------------------------

      const payload = {
        plan_id: currentPlanId,
      };

      console.log("DRY RUN PAYLOAD:", payload);

      const response = await performDryRun(payload);

      console.log("DRY RUN RAW RESPONSE:", response);

      // --------------------------------------------------
      // Normalize Axios response / normal object
      // --------------------------------------------------

      const normalizedResponse =
        response?.data ?? response ?? {};

      console.log(
        "DRY RUN NORMALIZED RESPONSE:",
        normalizedResponse
      );

      setResult(normalizedResponse);

      sessionStorage.setItem(
        "dryRunResult",
        JSON.stringify(normalizedResponse)
      );
    } catch (err) {
      console.error("DRY RUN ERROR:", err);

      setResult(null);
    }
  };

  // --------------------------------------------------
  // NORMALIZE BACKEND DRY-RUN RESULT
  //
  // Backend response:
  //
  // {
  //   success: true,
  //   plan_id: "...",
  //   run: {...},
  //   dry_run: {
  //      source_count: 24,
  //      accepted_count: 0,
  //      rejected_count: 24,
  //      quarantined_count: 24,
  //      accepted: [],
  //      rejected: [...]
  //   }
  // }
  //
  // --------------------------------------------------

  const dryRunResult =
    result?.dry_run ??
    result?.dryRun ??
    result?.result ??
    result ??
    {};

  const runResult = result?.run ?? {};

  // --------------------------------------------------
  // COUNTS
  // --------------------------------------------------

  const sourceCount = Number(
    dryRunResult?.source_count ??
      dryRunResult?.sourceCount ??
      dryRunResult?.total_source ??
      runResult?.source_count ??
      runResult?.sourceCount ??
      0
  );

  const transformedCount = Number(
    dryRunResult?.transformed_count ??
      dryRunResult?.transformedCount ??
      runResult?.transformed_count ??
      runResult?.transformedCount ??
      0
  );

  const acceptedCount = Number(
    dryRunResult?.accepted_count ??
      dryRunResult?.acceptedCount ??
      runResult?.accepted_count ??
      runResult?.acceptedCount ??
      0
  );

  const rejectedCount = Number(
    dryRunResult?.rejected_count ??
      dryRunResult?.rejectedCount ??
      runResult?.rejected_count ??
      runResult?.rejectedCount ??
      0
  );

  const duplicateCount = Number(
    dryRunResult?.duplicate_count ??
      dryRunResult?.duplicateCount ??
      runResult?.duplicate_count ??
      runResult?.duplicateCount ??
      0
  );

  const quarantinedCount = Number(
    dryRunResult?.quarantined_count ??
      dryRunResult?.quarantinedCount ??
      dryRunResult?.quarantine_count ??
      dryRunResult?.quarantineCount ??
      (Array.isArray(dryRunResult?.quarantined)
        ? dryRunResult.quarantined.length
        : 0)
  );

  // --------------------------------------------------
  // RECORD-LEVEL RESULTS
  //
  // Current backend returns:
  //
  // dry_run.accepted
  // dry_run.rejected
  //
  // Some versions may return:
  //
  // dry_run.records
  // dry_run.results
  //
  // Handle all of them.
  // --------------------------------------------------

  const acceptedRecords = Array.isArray(
    dryRunResult?.accepted
  )
    ? dryRunResult.accepted.map((record) => ({
        ...record,
        __resultStatus: "accepted",
      }))
    : [];

  const rejectedRecords = Array.isArray(
    dryRunResult?.rejected
  )
    ? dryRunResult.rejected.map((record) => ({
        ...record,
        __resultStatus: "rejected",
      }))
    : [];

  const directRecords = Array.isArray(
    dryRunResult?.records
  )
    ? dryRunResult.records
    : Array.isArray(dryRunResult?.results)
      ? dryRunResult.results
      : [];

  const records =
    directRecords.length > 0
      ? directRecords
      : [
          ...acceptedRecords,
          ...rejectedRecords,
        ];

  // --------------------------------------------------
  // FORMAT ERROR MESSAGE
  // --------------------------------------------------

  const formatErrors = (errors) => {
    if (!errors) {
      return "-";
    }

    if (typeof errors === "string") {
      return errors;
    }

    if (!Array.isArray(errors)) {
      return String(errors);
    }

    if (errors.length === 0) {
      return "-";
    }

    return errors
      .map((errorItem) => {
        if (typeof errorItem === "string") {
          return errorItem;
        }

        if (
          errorItem &&
          typeof errorItem === "object"
        ) {
          return (
            errorItem.message ||
            errorItem.detail ||
            errorItem.error ||
            JSON.stringify(errorItem)
          );
        }

        return String(errorItem);
      })
      .join(", ");
  };

  // --------------------------------------------------
  // DETERMINE RECORD STATUS
  // --------------------------------------------------

  const isRecordAccepted = (record) => {
    if (!record) {
      return false;
    }

    if (record.__resultStatus) {
      return record.__resultStatus === "accepted";
    }

    if (
      typeof record.accepted === "boolean"
    ) {
      return record.accepted;
    }

    if (
      typeof record.valid === "boolean"
    ) {
      return record.valid;
    }

    if (
      typeof record.is_valid === "boolean"
    ) {
      return record.is_valid;
    }

    if (
      typeof record.status === "string"
    ) {
      return (
        record.status.toLowerCase() ===
          "accepted" ||
        record.status.toLowerCase() ===
          "valid" ||
        record.status.toLowerCase() ===
          "success"
      );
    }

    // If errors exist, consider the record rejected
    if (
      Array.isArray(record.errors) &&
      record.errors.length > 0
    ) {
      return false;
    }

    return false;
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="page-shell">

      {/* --------------------------------------------------
          PAGE HEADER
      -------------------------------------------------- */}

      <div className="page-header">

        <div>

          <span className="page-eyebrow">
            VALIDATION
          </span>

          <h1>Dry Run</h1>

          <p>
            Validate the proposed migration without
            writing anything to the target database.
          </p>

          {/* CURRENT PLAN ID */}

          <div
            style={{
              marginTop: "12px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Plan ID:{" "}

            <strong>
              {planId || "Missing"}
            </strong>
          </div>

        </div>

        <div className="page-actions">

          <Button
            variant="secondary"
            onClick={() => navigate("/mapping")}
          >
            Back to Mapping
          </Button>

          <Button
            onClick={handleRun}
            disabled={loading || !planId}
          >
            {loading
              ? "Running..."
              : "Run Dry Run"}
          </Button>

        </div>

      </div>

      {/* --------------------------------------------------
          ERROR
      -------------------------------------------------- */}

      {error && (
        <ErrorMessage message={error} />
      )}

      {/* --------------------------------------------------
          MISSING PLAN ID
      -------------------------------------------------- */}

      {!planId && !loading && (
        <div
          style={{
            padding: "16px",
            marginTop: "20px",
            border: "1px solid #f59e0b",
            background: "#fffbeb",
            borderRadius: "8px",
            color: "#92400e",
          }}
        >
          <strong>
            Plan ID is missing.
          </strong>

          <div
            style={{
              marginTop: "6px",
            }}
          >
            Go back to Mapping and
            create/select a migration
            plan before running the dry run.
          </div>
        </div>
      )}

      {/* --------------------------------------------------
          LOADING
      -------------------------------------------------- */}

      {loading && !result && (
        <div className="center-state">

          <Loader />

          <p>
            Validating migration records...
          </p>

        </div>
      )}

      {/* --------------------------------------------------
          RESULT
      -------------------------------------------------- */}

      {result && (
        <>

          {/* --------------------------------------------------
              STATISTICS
          -------------------------------------------------- */}

          <div className="stats-grid">

            <div className="stat-card">

              <span>
                Source Records
              </span>

              <strong>
                {sourceCount}
              </strong>

            </div>

            <div className="stat-card success">

              <span>
                Transformed
              </span>

              <strong>
                {transformedCount}
              </strong>

            </div>

            <div className="stat-card success">

              <span>
                Accepted
              </span>

              <strong>
                {acceptedCount}
              </strong>

            </div>

            <div className="stat-card danger">

              <span>
                Rejected
              </span>

              <strong>
                {rejectedCount}
              </strong>

            </div>

            <div className="stat-card warning">

              <span>
                Quarantined
              </span>

              <strong>
                {quarantinedCount}
              </strong>

            </div>

            <div className="stat-card">

              <span>
                Duplicates
              </span>

              <strong>
                {duplicateCount}
              </strong>

            </div>

          </div>

          {/* --------------------------------------------------
              VALIDATION RESULT
          -------------------------------------------------- */}

          <section className="content-card">

            <div className="card-header">

              <div>

                <h2>
                  Validation Result
                </h2>

                <p>
                  Deterministic validation
                  performed on the sample
                  dataset.
                </p>

              </div>

              <Badge
                variant={
                  rejectedCount === 0
                    ? "success"
                    : "warning"
                }
              >
                {rejectedCount === 0
                  ? "Ready"
                  : "Review Required"}
              </Badge>

            </div>

            {/* --------------------------------------------------
                RECORD TABLE
            -------------------------------------------------- */}

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Source Record
                    </th>

                    <th>
                      Error
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {records.length === 0 ? (

                    <tr>

                      <td
                        colSpan="4"
                        className="empty-cell"
                      >
                        No record-level results
                        returned.
                      </td>

                    </tr>

                  ) : (

                    records.map(
                      (record, index) => {

                        const valid =
                          isRecordAccepted(
                            record
                          );

                        const sourceRecord =
                          record?.source_record ??
                          record?.source ??
                          record;

                        const recordErrors =
                          record?.errors ??
                          record?.error ??
                          null;

                        return (
                          <tr
                            key={
  record?.id ??
  record?.source_id ??
  record?.record_index ??
  index
}
                          >

                            {/* INDEX */}

                            <td>
                              {index + 1}
                            </td>

                            {/* STATUS */}

                            <td>

                              <Badge
                                variant={
                                  valid
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {valid
                                  ? "Accepted"
                                  : "Rejected"}
                              </Badge>

                            </td>

                            {/* SOURCE RECORD */}

                            <td>

                              <pre className="json-preview">
                                {JSON.stringify(
                                  sourceRecord,
                                  null,
                                  2
                                )}
                              </pre>

                            </td>

                            {/* ERROR */}

                            <td>

                              {formatErrors(
                                recordErrors
                              )}

                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

          {/* --------------------------------------------------
              BOTTOM ACTION
          -------------------------------------------------- */}

          <div className="bottom-actions">

            <Button
              onClick={() =>
                navigate("/migration")
              }
              disabled={
                acceptedCount === 0
              }
            >
              Continue to Migration
            </Button>

          </div>

        </>
      )}

    </div>
  );
}