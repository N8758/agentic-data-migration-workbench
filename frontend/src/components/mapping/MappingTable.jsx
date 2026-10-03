import MappingRow from "./MappingRow";

export default function MappingTable({
  mappings = [],
  onChange,
  readOnly = false,
}) {
  const items = Array.isArray(mappings) ? mappings : [];

  const updateMapping = (index, updated) => {
    if (!onChange) return;

    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  return (
    <section className="content-card mapping-table-card">
      <div className="card-header">
        <div>
          <span className="page-eyebrow">MAPPING PLAN</span>
          <h2>Field Mappings</h2>
          <p>
            Review how source fields will be mapped to target fields.
          </p>
        </div>

        <div className="mapping-count">
          <strong>{items.length}</strong>
          <span>Mappings</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mapping-empty">
          <div className="mapping-empty-icon">↔</div>
          <h3>No mappings available</h3>
          <p>
            Generate a migration plan to see the proposed field mappings.
          </p>
        </div>
      ) : (
        <div className="mapping-list">
          {items.map((mapping, index) => (
            <MappingRow
              key={
                mapping.id ||
                mapping.source_field ||
                mapping.source ||
                `mapping-${index}`
              }
              mapping={mapping}
              index={index}
              onChange={(updated) => updateMapping(index, updated)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  );
}