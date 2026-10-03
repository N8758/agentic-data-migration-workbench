import Badge from "../common/Badge";

export default function SchemaComparison({
  sourceSchema,
  targetSchema,
}) {
  const sourceFields =
    sourceSchema?.fields ||
    sourceSchema?.columns ||
    [];

  const targetFields =
    targetSchema?.fields ||
    targetSchema?.columns ||
    [];

  const sourceMap = new Map(
    sourceFields.map((field) => [
      field.name ||
        field.field_name ||
        field.column,
      field,
    ])
  );

  const targetMap = new Map(
    targetFields.map((field) => [
      field.name ||
        field.field_name ||
        field.column,
      field,
    ])
  );

  const names = [
    ...new Set([
      ...sourceFields.map(
        (field) =>
          field.name ||
          field.field_name ||
          field.column
      ),
      ...targetFields.map(
        (field) =>
          field.name ||
          field.field_name ||
          field.column
      ),
    ]),
  ];

  const getType = (field) => {
    if (!field) return "-";

    return (
      field.type ||
      field.data_type ||
      field.dtype ||
      "unknown"
    );
  };

  const getStatus = (source, target) => {
    if (source && target) {
      const sourceType = getType(source).toLowerCase();
      const targetType = getType(target).toLowerCase();

      if (sourceType === targetType) {
        return {
          label: "Compatible",
          variant: "success",
        };
      }

      return {
        label: "Type Change",
        variant: "warning",
      };
    }

    if (source && !target) {
      return {
        label: "Missing Target",
        variant: "danger",
      };
    }

    return {
      label: "Target Only",
      variant: "info",
    };
  };

  return (
    <section className="content-card schema-comparison-card">
      <div className="card-header">
        <div>
          <h2>Schema Comparison</h2>
          <p>
            Compare source and target fields before creating
            the migration plan.
          </p>
        </div>

        <Badge variant="info">
          {names.length} Fields
        </Badge>
      </div>

      <div className="comparison-summary">
        <div className="comparison-summary-item">
          <span>Source Fields</span>
          <strong>{sourceFields.length}</strong>
        </div>

        <div className="comparison-summary-item">
          <span>Target Fields</span>
          <strong>{targetFields.length}</strong>
        </div>

        <div className="comparison-summary-item">
          <span>Potential Changes</span>
          <strong>
            {
              names.filter((name) => {
                const source = sourceMap.get(name);
                const target = targetMap.get(name);

                return (
                  !source ||
                  !target ||
                  getType(source).toLowerCase() !==
                    getType(target).toLowerCase()
                );
              }).length
            }
          </strong>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table schema-comparison-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Source Type</th>
              <th>Target Type</th>
              <th>Source</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {names.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  No schema fields available.
                </td>
              </tr>
            ) : (
              names.map((name) => {
                const source = sourceMap.get(name);
                const target = targetMap.get(name);
                const status = getStatus(source, target);

                return (
                  <tr key={name}>
                    <td>
                      <strong className="field-name">
                        {name || "-"}
                      </strong>
                    </td>

                    <td>
                      <code className="type-code">
                        {getType(source)}
                      </code>
                    </td>

                    <td>
                      <code className="type-code">
                        {getType(target)}
                      </code>
                    </td>

                    <td>
                      {source ? (
                        <Badge variant="success">
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          Missing
                        </Badge>
                      )}
                    </td>

                    <td>
                      {target ? (
                        <Badge variant="success">
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          Missing
                        </Badge>
                      )}
                    </td>

                    <td>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
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