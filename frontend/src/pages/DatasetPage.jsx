import React, { useEffect, useState } from "react";
import * as schemaApi from "../api/schemaApi";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Badge from "../components/common/Badge";

export default function DatasetPage() {
  const [sourceSchema, setSourceSchema] = useState(null);
  const [targetSchema, setTargetSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    setLoading(true);
    setError("");

    try {
      const [sourceResponse, targetResponse] = await Promise.all([
        schemaApi.getSourceSchema(),
        schemaApi.getTargetSchema(),
      ]);

      setSourceSchema(sourceResponse?.data ?? sourceResponse);
      setTargetSchema(targetResponse?.data ?? targetResponse);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load schemas."
      );
    } finally {
      setLoading(false);
    }
  };

  const getFields = (schema) => {
    if (!schema) return [];

    if (Array.isArray(schema)) return schema;

    if (Array.isArray(schema.fields)) return schema.fields;

    if (schema.properties && typeof schema.properties === "object") {
      return Object.entries(schema.properties).map(([name, value]) => ({
        name,
        ...(typeof value === "object" ? value : { type: String(value) }),
      }));
    }

    return [];
  };

  const sourceFields = getFields(sourceSchema);
  const targetFields = getFields(targetSchema);

  const getSchemaName = (schema, fallback) =>
    schema?.name ||
    schema?.table_name ||
    schema?.table ||
    schema?.title ||
    fallback;

  if (loading) {
    return (
      <div className="dataset-page">
        <Loader fullPage size="large" text="Loading dataset schemas..." />
        <DatasetStyles />
      </div>
    );
  }

  return (
    <div className="dataset-page">
      <div className="page-top">
        <div>
          <div className="page-eyebrow">01 / Dataset</div>
          <h1>Dataset Inspection</h1>
          <p>
            Inspect the source and target structures before creating the
            migration mapping.
          </p>
        </div>

        <Button variant="secondary" onClick={loadSchemas}>
          ↻ Refresh Schemas
        </Button>
      </div>

      {error && (
        <ErrorMessage
          title="Schema loading failed"
          message={error}
          onRetry={loadSchemas}
        />
      )}

      {!error && (
        <>
          <div className="dataset-summary">
            <div className="summary-card">
              <div className="summary-label">Source</div>
              <div className="summary-value">{sourceFields.length}</div>
              <div className="summary-description">
                fields available for mapping
              </div>
            </div>

            <div className="summary-connector">
              <span>→</span>
            </div>

            <div className="summary-card">
              <div className="summary-label">Target</div>
              <div className="summary-value">{targetFields.length}</div>
              <div className="summary-description">
                fields available for migration
              </div>
            </div>
          </div>

          <div className="schema-grid">
            <SchemaPanel
              title="Source Schema"
              schemaName={getSchemaName(sourceSchema, "Source Dataset")}
              fields={sourceFields}
              type="source"
            />

            <SchemaPanel
              title="Target Schema"
              schemaName={getSchemaName(targetSchema, "Target Dataset")}
              fields={targetFields}
              type="target"
            />
          </div>

          <div className="dataset-note">
            <div className="note-icon">i</div>
            <div>
              <strong>Next step</strong>
              <p>
                Review these fields and continue to Mapping to let the agent
                propose a controlled migration plan.
              </p>
            </div>
          </div>
        </>
      )}

      <DatasetStyles />
    </div>
  );
}

function SchemaPanel({ title, schemaName, fields, type }) {
  return (
    <section className="schema-panel">
      <div className="schema-panel-header">
        <div className={`schema-symbol ${type}`}>
          {type === "source" ? "S" : "T"}
        </div>

        <div>
          <h2>{title}</h2>
          <span>{schemaName}</span>
        </div>

        <Badge variant={type === "source" ? "primary" : "success"}>
          {fields.length} fields
        </Badge>
      </div>

      <div className="field-table-wrapper">
        {fields.length === 0 ? (
          <div className="empty-fields">
            <div>∅</div>
            <span>No fields found</span>
          </div>
        ) : (
          <table className="field-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Field</th>
                <th>Type</th>
                <th>Required</th>
              </tr>
            </thead>

            <tbody>
              {fields.map((field, index) => {
                const name =
                  field?.name ||
                  field?.field ||
                  field?.column ||
                  `field_${index + 1}`;

                const typeValue =
                  field?.type ||
                  field?.data_type ||
                  field?.datatype ||
                  "unknown";

                const required =
                  field?.required === true ||
                  field?.nullable === false ||
                  field?.null === false;

                return (
                  <tr key={`${name}-${index}`}>
                    <td className="field-index">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="field-name">{name}</td>
                    <td>
                      <span className="type-label">
                        {String(typeValue)}
                      </span>
                    </td>
                    <td>
                      {required ? (
                        <Badge variant="warning" size="small" dot>
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="small">
                          Optional
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function DatasetStyles() {
  return (
    <style>{`
      .dataset-page {
        min-height: 100%;
        padding: 28px;
        box-sizing: border-box;
        background: #f8fafc;
        color: #111827;
      }

      .page-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 26px;
      }

      .page-eyebrow {
        margin-bottom: 7px;
        color: #2563eb;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .page-top h1 {
        margin: 0;
        font-size: 27px;
        letter-spacing: -.03em;
      }

      .page-top p {
        margin: 8px 0 0;
        color: #64748b;
        font-size: 13px;
      }

      .dataset-summary {
        display: grid;
        grid-template-columns: 1fr 60px 1fr;
        align-items: center;
        margin-bottom: 20px;
      }

      .summary-card {
        padding: 18px 20px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        background: #fff;
      }

      .summary-label {
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .summary-value {
        margin-top: 4px;
        color: #111827;
        font-size: 25px;
        font-weight: 800;
      }

      .summary-description {
        margin-top: 3px;
        color: #94a3b8;
        font-size: 11px;
      }

      .summary-connector {
        display: flex;
        justify-content: center;
        color: #2563eb;
        font-size: 22px;
      }

      .schema-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .schema-panel {
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, .03);
      }

      .schema-panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px;
        border-bottom: 1px solid #eef2f7;
      }

      .schema-symbol {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 40px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 800;
      }

      .schema-symbol.source {
        background: #eff6ff;
        color: #2563eb;
      }

      .schema-symbol.target {
        background: #ecfdf5;
        color: #059669;
      }

      .schema-panel-header > div:nth-child(2) {
        flex: 1;
        min-width: 0;
      }

      .schema-panel-header h2 {
        margin: 0;
        font-size: 14px;
      }

      .schema-panel-header span {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        color: #64748b;
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .field-table-wrapper {
        overflow-x: auto;
      }

      .field-table {
        width: 100%;
        border-collapse: collapse;
      }

      .field-table th {
        padding: 11px 14px;
        border-bottom: 1px solid #eef2f7;
        background: #fafbfc;
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
        text-align: left;
        text-transform: uppercase;
      }

      .field-table td {
        padding: 12px 14px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }

      .field-table tbody tr:last-child td {
        border-bottom: none;
      }

      .field-table tbody tr:hover {
        background: #fafcff;
      }

      .field-index {
        width: 30px;
        color: #94a3b8;
        font-size: 10px !important;
      }

      .field-name {
        color: #111827;
        font-weight: 650;
      }

      .type-label {
        display: inline-flex !important;
        padding: 4px 7px;
        border-radius: 5px;
        background: #f1f5f9;
        color: #475569 !important;
        font-family: monospace;
        font-size: 10px !important;
      }

      .empty-fields {
        min-height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        gap: 7px;
        font-size: 12px;
      }

      .empty-fields div {
        font-size: 25px;
      }

      .dataset-note {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-top: 20px;
        padding: 15px 17px;
        border: 1px solid #dbeafe;
        border-radius: 12px;
        background: #eff6ff;
      }

      .note-icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 28px;
        border-radius: 50%;
        background: #dbeafe;
        color: #2563eb;
        font-size: 12px;
        font-weight: 800;
      }

      .dataset-note strong {
        color: #1e3a8a;
        font-size: 12px;
      }

      .dataset-note p {
        margin: 4px 0 0;
        color: #1e40af;
        font-size: 11px;
        line-height: 1.5;
      }

      @media (max-width: 850px) {
        .schema-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .dataset-page {
          padding: 18px;
        }

        .page-top {
          flex-direction: column;
        }

        .dataset-summary {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .summary-connector {
          transform: rotate(90deg);
        }
      }
    `}</style>
  );
}