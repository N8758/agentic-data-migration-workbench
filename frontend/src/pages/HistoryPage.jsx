import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../api/historyApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export default function HistoryPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getHistory();

        const data =
          Array.isArray(response)
            ? response
            : response?.items ||
              response?.history ||
              response?.data ||
              [];

        setHistory(data);
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getStatusVariant = (status) => {
    const value = String(status || "").toLowerCase();

    if (
      value.includes("success") ||
      value.includes("complete") ||
      value.includes("approved")
    ) {
      return "success";
    }

    if (
      value.includes("fail") ||
      value.includes("reject") ||
      value.includes("error")
    ) {
      return "danger";
    }

    if (
      value.includes("rollback") ||
      value.includes("warning")
    ) {
      return "warning";
    }

    return "info";
  };

  if (loading) {
    return (
      <div className="center-state full-page-state">
        <Loader />
        <p>Loading history...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">AUDIT TRAIL</span>
          <h1>History</h1>
          <p>
            Review migration plans, approvals, executions, retries, and
            rollbacks.
          </p>
        </div>

        <Button onClick={() => navigate("/")}>
          Dashboard
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      <section className="content-card">
        <div className="card-header">
          <div>
            <h2>Migration History</h2>
            <p>{history.length} recorded event(s)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Migration ID</th>
                <th>Status</th>
                <th>User / Actor</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No migration history available.
                  </td>
                </tr>
              ) : (
                history.map((item, index) => {
                  const status = item.status || item.action || "Recorded";

                  return (
                    <tr key={item.id || index}>
                      <td>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : item.timestamp
                          ? new Date(item.timestamp).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        {item.type ||
                          item.event_type ||
                          item.action ||
                          "-"}
                      </td>

                      <td>
                        {item.migration_id ||
                          item.run_id ||
                          item.plan_id ||
                          "-"}
                      </td>

                      <td>
                        <Badge variant={getStatusVariant(status)}>
                          {status}
                        </Badge>
                      </td>

                      <td>
                        {item.actor ||
                          item.user ||
                          item.created_by ||
                          "-"}
                      </td>

                      <td>
                        {item.message ||
                          item.description ||
                          item.details ||
                          "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="bottom-actions">
        <Button
          variant="secondary"
          onClick={() => navigate("/")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}