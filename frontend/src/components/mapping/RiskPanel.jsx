import Badge from "../common/Badge";

export default function RiskPanel({
  mappings = [],
  risks = [],
}) {
  const mappingItems = Array.isArray(mappings) ? mappings : [];
  const riskItems = Array.isArray(risks) ? risks : [];

  const derivedRisks = mappingItems
    .filter((mapping) => {
      const risk =
        mapping.risk ||
        mapping.risk_level ||
        mapping.riskLevel ||
        "low";

      return String(risk).toLowerCase() !== "low";
    })
    .map((mapping, index) => ({
      id:
        mapping.id ||
        mapping.source_field ||
        `risk-${index}`,
      title:
        mapping.title ||
        mapping.source_field ||
        mapping.source ||
        "Mapping risk",
      description:
        mapping.reason ||
        mapping.explanation ||
        mapping.notes ||
        "This mapping requires additional review.",
      level:
        mapping.risk ||
        mapping.risk_level ||
        mapping.riskLevel ||
        "medium",
    }));

  const allRisks = [
    ...riskItems,
    ...derivedRisks,
  ];

  const highCount = allRisks.filter(
    (item) =>
      String(item.level || item.risk).toLowerCase() === "high"
  ).length;

  const mediumCount = allRisks.filter(
    (item) =>
      String(item.level || item.risk).toLowerCase() === "medium"
  ).length;

  const getVariant = (level) => {
    const value = String(level).toLowerCase();

    if (value === "high") return "danger";
    if (value === "medium") return "warning";
    return "info";
  };

  return (
    <section className="content-card risk-panel">
      <div className="card-header">
        <div>
          <span className="page-eyebrow">VALIDATION</span>
          <h2>Mapping Risks</h2>
          <p>
            Review potential issues before approving the migration plan.
          </p>
        </div>

        <Badge variant={highCount > 0 ? "danger" : "success"}>
          {allRisks.length} Risks
        </Badge>
      </div>

      <div className="risk-summary">
        <div className="risk-summary-card risk-summary-high">
          <span>High Risk</span>
          <strong>{highCount}</strong>
        </div>

        <div className="risk-summary-card risk-summary-medium">
          <span>Medium Risk</span>
          <strong>{mediumCount}</strong>
        </div>

        <div className="risk-summary-card risk-summary-total">
          <span>Total</span>
          <strong>{allRisks.length}</strong>
        </div>
      </div>

      {allRisks.length === 0 ? (
        <div className="risk-empty">
          <div className="risk-empty-icon">✓</div>
          <h3>No significant risks detected</h3>
          <p>
            The current mapping does not contain reported
            high or medium-risk issues.
          </p>
        </div>
      ) : (
        <div className="risk-list">
          {allRisks.map((risk, index) => {
            const level =
              risk.level ||
              risk.risk ||
              "medium";

            return (
              <div
                className={`risk-item risk-${String(level).toLowerCase()}`}
                key={risk.id || index}
              >
                <div className="risk-item-marker">
                  !
                </div>

                <div className="risk-item-content">
                  <div className="risk-item-header">
                    <h3>
                      {risk.title ||
                        risk.field ||
                        "Mapping Risk"}
                    </h3>

                    <Badge variant={getVariant(level)}>
                      {String(level).toUpperCase()}
                    </Badge>
                  </div>

                  <p>
                    {risk.description ||
                      "Additional review is required."}
                  </p>

                  {risk.source_field && (
                    <div className="risk-field">
                      Source:{" "}
                      <strong>{risk.source_field}</strong>
                    </div>
                  )}

                  {risk.target_field && (
                    <div className="risk-field">
                      Target:{" "}
                      <strong>{risk.target_field}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}