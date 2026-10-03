import Badge from "../common/Badge";

export default function SchemaCard({
  title,
  schema,
  type = "source",
  recordCount,
}) {
  const fields = schema?.fields || schema?.columns || [];
  const fieldCount = fields.length;

  return (
    <div className={`schema-card schema-card-${type}`}>
      <div className="schema-card-header">
        <div className="schema-card-icon">
          {type === "source" ? "S" : "T"}
        </div>

        <div className="schema-card-title">
          <span className="page-eyebrow">
            {type === "source" ? "SOURCE" : "TARGET"}
          </span>
          <h3>{title}</h3>
        </div>

        <Badge variant={type === "source" ? "info" : "success"}>
          {type === "source" ? "Input" : "Destination"}
        </Badge>
      </div>

      <div className="schema-card-stats">
        <div className="schema-stat">
          <span>Fields</span>
          <strong>{fieldCount}</strong>
        </div>

        <div className="schema-stat">
          <span>Records</span>
          <strong>{recordCount ?? schema?.record_count ?? "-"}</strong>
        </div>
      </div>

      <div className="schema-field-preview">
        {fields.length === 0 ? (
          <div className="schema-empty">
            No fields available.
          </div>
        ) : (
          fields.slice(0, 5).map((field, index) => {
            const name =
              field.name ||
              field.field_name ||
              field.column ||
              `field_${index + 1}`;

            const fieldType =
              field.type ||
              field.data_type ||
              field.dtype ||
              "unknown";

            return (
              <div className="schema-preview-row" key={name}>
                <span>{name}</span>
                <code>{fieldType}</code>
              </div>
            );
          })
        )}

        {fields.length > 5 && (
          <div className="schema-more">
            +{fields.length - 5} more fields
          </div>
        )}
      </div>
    </div>
  );
}