import Badge from "../common/Badge";

export default function MappingRow({
  mapping = {},
  index,
  onChange,
  readOnly = false,
}) {
  const sourceField =
    mapping.source_field ||
    mapping.source ||
    mapping.source_column ||
    "";

  const targetField =
    mapping.target_field ||
    mapping.target ||
    mapping.target_column ||
    "";

  const sourceType =
    mapping.source_type ||
    mapping.source_data_type ||
    mapping.sourceType ||
    "unknown";

  const targetType =
    mapping.target_type ||
    mapping.target_data_type ||
    mapping.targetType ||
    "unknown";

  const transformation =
    mapping.transformation ||
    mapping.transform ||
    mapping.transformation_rule ||
    "none";

  const confidence =
    mapping.confidence === undefined ||
    mapping.confidence === null
      ? null
      : Number(mapping.confidence);

  const risk =
    mapping.risk ||
    mapping.risk_level ||
    mapping.riskLevel ||
    "low";

  const status =
    mapping.status ||
    (sourceField && targetField ? "mapped" : "unmapped");

  const reason =
    mapping.reason ||
    mapping.explanation ||
    mapping.notes ||
    "";

  const normalizeConfidence = (value) => {
    if (value === null || Number.isNaN(value)) return null;

    if (value <= 1) {
      return Math.round(value * 100);
    }

    return Math.round(value);
  };

  const confidenceValue = normalizeConfidence(confidence);

  const getRiskVariant = (value) => {
    const normalized = String(value).toLowerCase();

    if (normalized === "high") return "danger";
    if (normalized === "medium") return "warning";
    return "success";
  };

  const getStatusVariant = (value) => {
    const normalized = String(value).toLowerCase();

    if (
      normalized === "approved" ||
      normalized === "mapped" ||
      normalized === "valid"
    ) {
      return "success";
    }

    if (
      normalized === "review" ||
      normalized === "needs_review" ||
      normalized === "pending"
    ) {
      return "warning";
    }

    if (
      normalized === "rejected" ||
      normalized === "invalid" ||
      normalized === "unmapped"
    ) {
      return "danger";
    }

    return "info";
  };

  const handleTransformationChange = (event) => {
    if (!onChange || readOnly) return;

    onChange({
      ...mapping,
      transformation: event.target.value,
    });
  };

  return (
    <div className="mapping-row">
      <div className="mapping-index">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="mapping-source mapping-field-block">
        <span className="mapping-label">SOURCE</span>

        <strong className="mapping-field-name">
          {sourceField || "Not mapped"}
        </strong>

        <code>{sourceType}</code>
      </div>

      <div className="mapping-arrow">
        <span>→</span>
      </div>

      <div className="mapping-target mapping-field-block">
        <span className="mapping-label">TARGET</span>

        <strong className="mapping-field-name">
          {targetField || "Not mapped"}
        </strong>

        <code>{targetType}</code>
      </div>

      <div className="mapping-transformation">
        <span className="mapping-label">TRANSFORMATION</span>

        {readOnly ? (
          <code className="transformation-value">
            {transformation}
          </code>
        ) : (
          <select
            value={transformation}
            onChange={handleTransformationChange}
            className="mapping-select"
          >
            <option value="none">No transformation</option>
            <option value="lowercase">Lowercase</option>
            <option value="uppercase">Uppercase</option>
            <option value="trim">Trim</option>
            <option value="string_to_integer">
              String → Integer
            </option>
            <option value="string_to_float">
              String → Float
            </option>
            <option value="integer_to_string">
              Integer → String
            </option>
            <option value="date_format">
              Date Format
            </option>
            <option value="currency_normalize">
              Currency Normalize
            </option>
          </select>
        )}
      </div>

      <div className="mapping-meta">
        <div className="mapping-meta-item">
          <span>Risk</span>
          <Badge variant={getRiskVariant(risk)}>
            {String(risk).toUpperCase()}
          </Badge>
        </div>

        <div className="mapping-meta-item">
          <span>Status</span>
          <Badge variant={getStatusVariant(status)}>
            {String(status).replaceAll("_", " ").toUpperCase()}
          </Badge>
        </div>

        {confidenceValue !== null && (
          <div className="mapping-confidence">
            <div className="confidence-header">
              <span>Confidence</span>
              <strong>{confidenceValue}%</strong>
            </div>

            <div className="confidence-track">
              <div
                className="confidence-fill"
                style={{
                  width: `${Math.min(
                    Math.max(confidenceValue, 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {reason && (
        <div className="mapping-reason">
          <span>AI reasoning</span>
          <p>{reason}</p>
        </div>
      )}
    </div>
  );
}