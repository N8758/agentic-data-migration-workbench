import Badge from "../common/Badge";

export default function FieldTable({
  fields = [],
  title = "Fields",
  emptyMessage = "No fields available.",
}) {
  const normalizedFields = Array.isArray(fields) ? fields : [];

  return (
    <section className="content-card field-table-card">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          <p>
            {normalizedFields.length} field
            {normalizedFields.length === 1 ? "" : "s"} detected
          </p>
        </div>

        <Badge variant="info">
          {normalizedFields.length}
        </Badge>
      </div>

      <div className="table-wrapper">
        <table className="data-table field-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Field Name</th>
              <th>Data Type</th>
              <th>Required</th>
              <th>Nullable</th>
              <th>Default</th>
            </tr>
          </thead>

          <tbody>
            {normalizedFields.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              normalizedFields.map((field, index) => {
                const name =
                  field.name ||
                  field.field_name ||
                  field.column ||
                  `field_${index + 1}`;

                const type =
                  field.type ||
                  field.data_type ||
                  field.dtype ||
                  "unknown";

                const required =
                  field.required ??
                  field.is_required ??
                  false;

                const nullable =
                  field.nullable ??
                  field.is_nullable ??
                  !required;

                const defaultValue =
                  field.default ??
                  field.default_value ??
                  null;

                return (
                  <tr key={`${name}-${index}`}>
                    <td>{index + 1}</td>

                    <td>
                      <strong className="field-name">
                        {name}
                      </strong>
                    </td>

                    <td>
                      <code className="type-code">
                        {type}
                      </code>
                    </td>

                    <td>
                      <Badge variant={required ? "warning" : "neutral"}>
                        {required ? "Yes" : "No"}
                      </Badge>
                    </td>

                    <td>
                      <Badge variant={nullable ? "info" : "neutral"}>
                        {nullable ? "Yes" : "No"}
                      </Badge>
                    </td>

                    <td>
                      {defaultValue === null ||
                      defaultValue === undefined ||
                      defaultValue === ""
                        ? "-"
                        : String(defaultValue)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}