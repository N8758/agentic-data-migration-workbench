import React, { useEffect, useState } from "react";

import * as agentApi from "../api/agentApi";
import * as planApi from "../api/planApi";

import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";


export default function MappingPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState("");
  const [selectedMapping, setSelectedMapping] = useState(null);

  useEffect(() => {
    loadExistingPlan();
  }, []);

  // ============================================================
  // LOAD EXISTING PLAN
  // ============================================================

  const loadExistingPlan = async () => {
    setLoadingExisting(true);
    setError("");

    try {
      const response = await planApi.getPlans();

      const data = response?.data ?? response;

      const plans = Array.isArray(data)
        ? data
        : data?.plans ||
          data?.items ||
          [];

      if (!plans.length) {
        setPlan(null);
        return;
      }

      const first = plans[0];

      const id =
        first?.id ??
        first?.plan_id;

      let planData = first;

      // Try loading complete plan details.
      if (id) {
        try {
          const detailResponse = await planApi.getPlan(id);

          const detailData =
            detailResponse?.data ??
            detailResponse;

          // Some APIs return { success, plan }
          planData =
            detailData?.plan ??
            detailData ??
            first;
        } catch (detailError) {
          console.warn(
            "Unable to load plan details. Using plan list data.",
            detailError
          );

          planData = first;
        }
      }

      setPlan(planData);

      savePlanId(planData, id);
    } catch (err) {
      console.error("Failed to load migration plans:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load migration plans."
      );
    } finally {
      setLoadingExisting(false);
    }
  };

  // ============================================================
  // SAVE PLAN ID
  // ============================================================

  const savePlanId = (planData, fallbackId = null) => {
    const finalPlanId =
      planData?.id ??
      planData?.plan_id ??
      fallbackId ??
      null;

    if (!finalPlanId) {
      console.warn(
        "Migration plan does not contain an ID:",
        planData
      );
      return null;
    }

    sessionStorage.setItem(
      "migrationPlanId",
      String(finalPlanId)
    );

    sessionStorage.setItem(
      "plan_id",
      String(finalPlanId)
    );

    console.log(
      "Migration Plan ID saved:",
      finalPlanId
    );

    return finalPlanId;
  };

  // ============================================================
  // GENERATE AI PLAN
  // ============================================================

  const generatePlan = async () => {
    setLoading(true);
    setError("");
    setSelectedMapping(null);

    try {
      const response = await agentApi.generatePlan();

      console.log(
        "========== GENERATE PLAN RESPONSE =========="
      );
      console.log(response);
      console.log(
        "============================================"
      );

      const data =
        response?.data ??
        response ??
        {};

      const planData =
        data?.plan ??
        data;

      if (!planData || typeof planData !== "object") {
        throw new Error(
          "AI returned an invalid migration plan."
        );
      }

      /*
       * A newly generated plan must be treated as draft.
       * The backend dry-run endpoint requires approved status.
       */
      const normalizedPlan = {
        ...planData,
        status:
          planData.status ||
          "draft",
      };

      setPlan(normalizedPlan);

      const finalPlanId = savePlanId(
        normalizedPlan,
        data?.plan_id ??
          data?.id ??
          null
      );

      if (!finalPlanId) {
        console.warn(
          "No migration plan ID returned from generatePlan:",
          data
        );
      }
    } catch (err) {
      console.error(
        "Failed to generate migration plan:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to generate migration plan."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // APPROVE PLAN
  // ============================================================

  const approvePlan = async () => {
    setLoading(true);
    setError("");

    try {
      const planId =
        plan?.id ||
        plan?.plan_id ||
        sessionStorage.getItem(
          "migrationPlanId"
        ) ||
        sessionStorage.getItem("plan_id");

      if (!planId) {
        throw new Error(
          "Migration plan ID not found."
        );
      }

      /*
       * Your backend route is:
       *
       * POST /plans/{plan_id}/approve
       *
       * Backend code shown earlier uses this route.
       */

      const apiBase =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8000";
const response = await fetch(
  `${apiBase}/api/plans/${encodeURIComponent(
    planId
  )}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "Approved for dry run",
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Failed to approve migration plan (${response.status}).`
        );
      }

      const approvedPlan =
        data?.plan ??
        data;

      /*
       * Update local UI immediately.
       */
      setPlan((previous) => ({
        ...(previous || {}),
        ...(approvedPlan || {}),
        id:
          approvedPlan?.id ??
          previous?.id ??
          planId,
        plan_id:
          approvedPlan?.plan_id ??
          previous?.plan_id ??
          planId,
        status: "approved",
      }));

      /*
       * Keep the same ID in storage.
       */
      sessionStorage.setItem(
        "migrationPlanId",
        String(planId)
      );

      sessionStorage.setItem(
        "plan_id",
        String(planId)
      );

      console.log(
        "Migration plan approved successfully:",
        planId
      );
    } catch (err) {
      console.error(
        "Failed to approve migration plan:",
        err
      );

      setError(
        err?.message ||
          "Unable to approve migration plan."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DATA HELPERS
  // ============================================================

  const getMappings = () => {
    if (!plan) {
      return [];
    }

    const value =
      plan.mappings ??
      plan.field_mappings ??
      plan.mapping ??
      plan.proposed_mappings ??
      [];

    return Array.isArray(value)
      ? value
      : [];
  };

  const getTransformations = () => {
    if (!plan) {
      return [];
    }

    const value =
      plan.transformations ??
      plan.transformation_rules ??
      plan.proposed_transformations ??
      [];

    return Array.isArray(value)
      ? value
      : [];
  };

  const getRisks = () => {
    if (!plan) {
      return [];
    }

    const value =
      plan.risks ??
      plan.mapping_risks ??
      [];

    return Array.isArray(value)
      ? value
      : [];
  };

  const getQuestions = () => {
    if (!plan) {
      return [];
    }

    const value =
      plan.clarification_questions ??
      plan.questions ??
      plan.clarifications ??
      [];

    return Array.isArray(value)
      ? value
      : [];
  };

  const mappings = getMappings();
  const transformations = getTransformations();
  const risks = getRisks();
  const questions = getQuestions();

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingExisting) {
    return (
      <div className="mapping-page">
        <Loader
          fullPage
          size="large"
          text="Loading migration plan..."
        />

        <MappingStyles />
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="mapping-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mapping-header">

        <div>
          <div className="mapping-eyebrow">
            02 / AI Mapping
          </div>

          <h1>
            Migration Mapping
          </h1>

          <p>
            Review the agent-proposed
            source-to-target mapping before
            approving the migration plan.
          </p>
        </div>

        <div className="mapping-header-actions">

          <Button
            variant="primary"
            loading={loading}
            onClick={generatePlan}
          >
            {plan
              ? "Regenerate Plan"
              : "Generate AI Plan"}
          </Button>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mapping-error">

          <ErrorMessage
            title="Migration plan error"
            message={error}
            onRetry={
              plan
                ? loadExistingPlan
                : generatePlan
            }
          />

        </div>
      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!plan &&
        !loading &&
        !error && (
          <div className="mapping-empty">

            <div className="empty-agent-icon">
              AI
            </div>

            <h2>
              No migration plan available
            </h2>

            <p>
              The AI agent will inspect the
              provided source schema, target
              schema, records, and supported
              transformation rules before
              proposing a migration plan.
            </p>

            <Button
              variant="primary"
              onClick={generatePlan}
            >
              Generate Migration Plan
            </Button>

          </div>
        )}

      {/* ======================================================
          GENERATING
      ====================================================== */}

      {loading && (
        <div className="mapping-generating">

          <Loader
            size="large"
            text="Agent is generating the migration plan..."
          />

          <p>
            Inspecting schemas, checking
            supported transformations, and
            evaluating mapping risks.
          </p>

        </div>
      )}

      {/* ======================================================
          PLAN
      ====================================================== */}

      {plan && !loading && (
        <>

          {/* ==================================================
              PLAN OVERVIEW
          ================================================== */}

          <div className="plan-overview">

            <div className="overview-main">

              <div className="agent-badge">
                AI
              </div>

              <div>

                <span className="overview-label">
                  Proposed Migration Plan
                </span>

                <h2>
                  {plan.name ||
                    plan.title ||
                    `Migration Plan #${
                      plan.id || "Draft"
                    }`}
                </h2>

              </div>

            </div>

            <div className="overview-meta">

              <Badge variant="primary">
                {plan.status || "draft"}
              </Badge>

              <span>
                Version{" "}
                {plan.current_version ??
                  plan.version ??
                  1}
              </span>

              {String(
                plan.status || "draft"
              ).toLowerCase() !==
                "approved" && (
                <Button
                  variant="primary"
                  loading={loading}
                  onClick={approvePlan}
                >
                  Approve Plan
                </Button>
              )}

            </div>
          </div>

          {/* ==================================================
              STATS
          ================================================== */}

          <div className="mapping-stats">

            <div className="mapping-stat">
              <span>Mappings</span>
              <strong>
                {mappings.length}
              </strong>
            </div>

            <div className="mapping-stat">
              <span>Transformations</span>
              <strong>
                {transformations.length}
              </strong>
            </div>

            <div className="mapping-stat">
              <span>Risks</span>
              <strong
                className={
                  risks.length
                    ? "risk-number"
                    : ""
                }
              >
                {risks.length}
              </strong>
            </div>

            <div className="mapping-stat">
              <span>Questions</span>
              <strong>
                {questions.length}
              </strong>
            </div>

          </div>

          {/* ==================================================
              MAIN LAYOUT
          ================================================== */}

          <div className="mapping-layout">

            {/* =================================================
                MAPPINGS
            ================================================= */}

            <section className="mapping-card">

              <div className="mapping-card-header">

                <div>
                  <h2>
                    Field Mapping
                  </h2>

                  <p>
                    Proposed source → target
                    relationships.
                  </p>
                </div>

                <Badge variant="primary">
                  {mappings.length} mappings
                </Badge>

              </div>

              <div className="mapping-table-wrapper">

                {mappings.length === 0 ? (
                  <div className="mapping-empty-table">
                    No mappings were returned
                    by the agent.
                  </div>
                ) : (
                  <table className="mapping-table">

                    <thead>
                      <tr>
                        <th>
                          Source Field
                        </th>

                        <th></th>

                        <th>
                          Target Field
                        </th>

                        <th>
                          Transformation
                        </th>

                        <th>
                          Confidence
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {mappings.map(
                        (mapping, index) => {

                          const source =
                            mapping?.source_field ||
                            mapping?.source ||
                            mapping?.from ||
                            mapping?.source_column ||
                            "—";

                          const target =
                            mapping?.target_field ||
                            mapping?.target ||
                            mapping?.to ||
                            mapping?.target_column ||
                            "—";

                          const transformation =
                            mapping?.transformation ||
                            mapping?.transform ||
                            mapping?.rule ||
                            "Direct";

                          const confidence =
                            mapping?.confidence ??
                            mapping?.score ??
                            null;

                          const risk =
                            mapping?.risk ||
                            mapping?.risk_level ||
                            "low";

                          return (
                            <tr
                              key={
                                mapping?.id ||
                                `${source}-${target}-${index}`
                              }
                              className="mapping-row"
                              onClick={() =>
                                setSelectedMapping(
                                  mapping
                                )
                              }
                            >

                              <td>
                                <span className="field-chip source-chip">
                                  {source}
                                </span>
                              </td>

                              <td className="mapping-arrow">
                                →
                              </td>

                              <td>
                                <span className="field-chip target-chip">
                                  {target}
                                </span>
                              </td>

                              <td>
                                <span className="transformation-value">
                                  {String(
                                    transformation
                                  )}
                                </span>
                              </td>

                              <td>
                                <ConfidenceBadge
                                  confidence={
                                    confidence
                                  }
                                  risk={risk}
                                />
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>
                  </table>
                )}

              </div>

            </section>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="mapping-side">

              {/* =================================================
                  RISKS
              ================================================= */}

              <section className="mapping-card">

                <div className="mapping-card-header">

                  <div>
                    <h2>
                      Risks
                    </h2>

                    <p>
                      Potential migration
                      concerns.
                    </p>
                  </div>

                </div>

                <div className="side-content">

                  {risks.length === 0 ? (
                    <div className="side-empty success">

                      <span>✓</span>

                      <div>
                        <strong>
                          No risks reported
                        </strong>

                        <p>
                          The agent did not
                          identify mapping
                          risks.
                        </p>
                      </div>

                    </div>
                  ) : (
                    risks.map(
                      (risk, index) => {

                        const title =
                          typeof risk ===
                          "string"
                            ? risk
                            : risk?.title ||
                              risk?.description ||
                              "Mapping risk";

                        const description =
                          typeof risk ===
                          "object"
                            ? risk?.description
                            : null;

                        return (
                          <div
                            className="risk-item"
                            key={index}
                          >

                            <div className="risk-dot" />

                            <div>

                              <strong>
                                {title}
                              </strong>

                              {description &&
                                risk?.title && (
                                  <p>
                                    {description}
                                  </p>
                                )}

                            </div>

                          </div>
                        );
                      }
                    )
                  )}

                </div>

              </section>

              {/* =================================================
                  CLARIFICATIONS
              ================================================= */}

              <section className="mapping-card">

                <div className="mapping-card-header">

                  <div>
                    <h2>
                      Clarifications
                    </h2>

                    <p>
                      Questions requiring
                      reviewer input.
                    </p>
                  </div>

                </div>

                <div className="side-content">

                  {questions.length === 0 ? (
                    <div className="side-empty success">

                      <span>✓</span>

                      <div>
                        <strong>
                          No clarification
                          needed
                        </strong>

                        <p>
                          The proposed mapping
                          is sufficiently
                          defined.
                        </p>
                      </div>

                    </div>
                  ) : (
                    questions.map(
                      (question, index) => {

                        const text =
                          typeof question ===
                          "string"
                            ? question
                            : question?.question ||
                              question?.text ||
                              question?.description ||
                              "Clarification required";

                        return (
                          <div
                            className="question-item"
                            key={index}
                          >

                            <span>
                              {index + 1}
                            </span>

                            <p>
                              {text}
                            </p>

                          </div>
                        );
                      }
                    )
                  )}

                </div>

              </section>

            </div>

          </div>

          {/* ==================================================
              MAPPING DETAIL MODAL
          ================================================== */}

          {selectedMapping && (
            <div
              className="mapping-detail-overlay"
              onClick={() =>
                setSelectedMapping(null)
              }
            >

              <div
                className="mapping-detail"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                <div className="detail-header">

                  <div>

                    <span>
                      Mapping Details
                    </span>

                    <h2>
                      {selectedMapping.source_field ||
                        selectedMapping.source ||
                        "Source"}

                      {" → "}

                      {selectedMapping.target_field ||
                        selectedMapping.target ||
                        "Target"}
                    </h2>

                  </div>

                  <button
                    type="button"
                    className="detail-close"
                    onClick={() =>
                      setSelectedMapping(null)
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="detail-body">

                  <DetailRow
                    label="Source Field"
                    value={
                      selectedMapping.source_field ||
                      selectedMapping.source ||
                      selectedMapping.from ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Target Field"
                    value={
                      selectedMapping.target_field ||
                      selectedMapping.target ||
                      selectedMapping.to ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Transformation"
                    value={
                      selectedMapping.transformation ||
                      selectedMapping.transform ||
                      selectedMapping.rule ||
                      "Direct"
                    }
                  />

                  <DetailRow
                    label="Confidence"
                    value={
                      selectedMapping.confidence ??
                      selectedMapping.score ??
                      "Not specified"
                    }
                  />

                  <DetailRow
                    label="Risk"
                    value={
                      selectedMapping.risk ||
                      selectedMapping.risk_level ||
                      "Low"
                    }
                  />

                  <DetailRow
                    label="Reason"
                    value={
                      selectedMapping.reason ||
                      selectedMapping.reasoning ||
                      selectedMapping.explanation ||
                      selectedMapping.rationale ||
                      "No explanation provided."
                    }
                  />

                </div>

              </div>

            </div>
          )}

        </>
      )}

      <MappingStyles />

    </div>
  );
}


// ================================================================
// CONFIDENCE BADGE
// ================================================================

function ConfidenceBadge({
  confidence,
  risk,
}) {
  if (
    confidence === null ||
    confidence === undefined ||
    Number.isNaN(
      parseFloat(
        String(confidence).replace("%", "")
      )
    )
  ) {
    return (
      <Badge
        variant={
          String(risk).toLowerCase() === "high"
            ? "danger"
            : "neutral"
        }
      >
        Not specified
      </Badge>
    );
  }

  const numeric =
    typeof confidence === "number"
      ? confidence
      : parseFloat(
          String(confidence).replace("%", "")
        );

  const percentage =
    numeric <= 1 && numeric >= 0
      ? Math.round(numeric * 100)
      : Math.round(numeric);

  let variant = "success";

  if (percentage < 70) {
    variant = "danger";
  } else if (percentage < 85) {
    variant = "warning";
  }

  return (
    <Badge variant={variant}>
      {percentage}%
    </Badge>
  );
}


// ================================================================
// DETAIL ROW
// ================================================================

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="detail-row">

      <span>
        {label}
      </span>

      <strong>
        {String(
          value ?? "—"
        )}
      </strong>

    </div>
  );
}


// ================================================================
// STYLES
// ================================================================

function MappingStyles() {
  return (
    <style>{`

      .mapping-page {
        min-height: 100%;
        padding: 28px;
        box-sizing: border-box;
        background: #f8fafc;
        color: #111827;
      }

      .mapping-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 25px;
      }

      .mapping-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .mapping-eyebrow {
        margin-bottom: 7px;
        color: #7c3aed;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .mapping-header h1 {
        margin: 0;
        font-size: 27px;
        letter-spacing: -.03em;
      }

      .mapping-header p {
        margin: 8px 0 0;
        color: #64748b;
        font-size: 13px;
      }

      .mapping-error {
        margin-bottom: 20px;
      }

      .plan-overview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 18px 20px;
        margin-bottom: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #fff;
      }

      .overview-main {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .agent-badge {
        width: 43px;
        height: 43px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 43px;
        border-radius: 11px;
        background: #f5f3ff;
        color: #7c3aed;
        font-size: 12px;
        font-weight: 800;
      }

      .overview-label {
        display: block;
        margin-bottom: 3px;
        color: #94a3b8;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .overview-main h2 {
        margin: 0;
        font-size: 15px;
        overflow-wrap: anywhere;
      }

      .overview-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #64748b;
        font-size: 11px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .mapping-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 18px;
      }

      .mapping-stat {
        padding: 15px 17px;
        border: 1px solid #e5e7eb;
        border-radius: 11px;
        background: #fff;
      }

      .mapping-stat span {
        display: block;
        margin-bottom: 5px;
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .mapping-stat strong {
        font-size: 20px;
      }

      .mapping-stat .risk-number {
        color: #dc2626;
      }

      .mapping-layout {
        display: grid;
        grid-template-columns:
          minmax(0, 1.55fr)
          minmax(300px, .65fr);
        gap: 18px;
      }

      .mapping-card {
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #fff;
        box-shadow:
          0 1px 2px
          rgba(15, 23, 42, .03);
      }

      .mapping-side {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .mapping-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 18px;
        border-bottom: 1px solid #eef2f7;
      }

      .mapping-card-header h2 {
        margin: 0;
        font-size: 14px;
      }

      .mapping-card-header p {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 11px;
      }

      .mapping-table-wrapper {
        overflow-x: auto;
      }

      .mapping-table {
        width: 100%;
        border-collapse: collapse;
      }

      .mapping-table th {
        padding: 11px 14px;
        background: #fafbfc;
        border-bottom: 1px solid #eef2f7;
        color: #64748b;
        font-size: 10px;
        text-align: left;
        text-transform: uppercase;
      }

      .mapping-table td {
        padding: 13px 14px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 11px;
      }

      .mapping-row {
        cursor: pointer;
        transition: background .15s ease;
      }

      .mapping-row:hover {
        background: #f8fafc;
      }

      .mapping-row:last-child td {
        border-bottom: none;
      }

      .field-chip {
        display: inline-flex;
        max-width: 180px;
        overflow: hidden;
        padding: 6px 8px;
        border-radius: 6px;
        font-family: monospace;
        font-size: 10px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .source-chip {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .target-chip {
        background: #ecfdf5;
        color: #047857;
      }

      .mapping-arrow {
        color: #94a3b8;
        text-align: center !important;
      }

      .transformation-value {
        display: inline-block;
        max-width: 160px;
        color: #475569;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .side-content {
        padding: 14px;
      }

      .risk-item {
        display: flex;
        gap: 10px;
        padding: 11px;
        border-radius: 8px;
        background: #fffbeb;
      }

      .risk-item + .risk-item {
        margin-top: 8px;
      }

      .risk-dot {
        width: 7px;
        height: 7px;
        margin-top: 5px;
        flex: 0 0 7px;
        border-radius: 50%;
        background: #f59e0b;
      }

      .risk-item strong {
        display: block;
        color: #92400e;
        font-size: 11px;
        line-height: 1.45;
      }

      .risk-item p {
        margin: 3px 0 0;
        color: #a16207;
        font-size: 10px;
        line-height: 1.45;
      }

      .side-empty {
        display: flex;
        gap: 10px;
        padding: 13px;
        border-radius: 9px;
      }

      .side-empty.success {
        background: #f0fdf4;
      }

      .side-empty > span {
        color: #15803d;
        font-weight: 800;
      }

      .side-empty strong {
        display: block;
        color: #166534;
        font-size: 11px;
      }

      .side-empty p {
        margin: 3px 0 0;
        color: #4d7c0f;
        font-size: 10px;
        line-height: 1.45;
      }

      .question-item {
        display: flex;
        gap: 9px;
        padding: 10px;
        border: 1px solid #e0e7ff;
        border-radius: 8px;
        background: #f8faff;
      }

      .question-item + .question-item {
        margin-top: 8px;
      }

      .question-item > span {
        width: 21px;
        height: 21px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 21px;
        border-radius: 6px;
        background: #e0e7ff;
        color: #4338ca;
        font-size: 9px;
        font-weight: 800;
      }

      .question-item p {
        margin: 2px 0 0;
        color: #3730a3;
        font-size: 10px;
        line-height: 1.5;
      }

      .mapping-empty {
        min-height: 430px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        background: #fff;
        text-align: center;
      }

      .empty-agent-icon {
        width: 58px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
        border-radius: 15px;
        background: #f5f3ff;
        color: #7c3aed;
        font-weight: 800;
      }

      .mapping-empty h2 {
        margin: 0;
        font-size: 17px;
      }

      .mapping-empty p {
        max-width: 520px;
        margin: 8px 0 20px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.6;
      }

      .mapping-generating {
        min-height: 350px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #fff;
      }

      .mapping-generating p {
        max-width: 450px;
        margin: 15px 0 0;
        color: #64748b;
        font-size: 12px;
        text-align: center;
      }

      .mapping-empty-table {
        padding: 40px;
        color: #94a3b8;
        font-size: 12px;
        text-align: center;
      }

      .mapping-detail-overlay {
        position: fixed;
        inset: 0;
        z-index: 1100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 23, 42, .5);
        backdrop-filter: blur(3px);
      }

      .mapping-detail {
        width: 100%;
        max-width: 540px;
        overflow: hidden;
        border-radius: 14px;
        background: #fff;
        box-shadow:
          0 25px 70px
          rgba(15, 23, 42, .2);
      }

      .detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding: 18px 20px;
        border-bottom: 1px solid #eef2f7;
      }

      .detail-header span {
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .detail-header h2 {
        margin: 4px 0 0;
        font-size: 15px;
        overflow-wrap: anywhere;
      }

      .detail-close {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 7px;
        background: #f1f5f9;
        color: #475569;
        font-size: 20px;
        cursor: pointer;
      }

      .detail-close:hover {
        background: #e2e8f0;
      }

      .detail-body {
        padding: 18px 20px;
      }

      .detail-row {
        display: grid;
        grid-template-columns: 130px 1fr;
        gap: 15px;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-row span {
        color: #64748b;
        font-size: 11px;
        font-weight: 600;
      }

      .detail-row strong {
        color: #111827;
        font-size: 11px;
        line-height: 1.5;
        word-break: break-word;
      }

      @media (max-width: 1000px) {

        .mapping-layout {
          grid-template-columns: 1fr;
        }

        .mapping-stats {
          grid-template-columns:
            repeat(2, 1fr);
        }

      }

      @media (max-width: 650px) {

        .mapping-page {
          padding: 18px;
        }

        .mapping-header,
        .plan-overview {
          flex-direction: column;
          align-items: flex-start;
        }

        .mapping-header-actions {
          width: 100%;
        }

        .overview-meta {
          justify-content: flex-start;
        }

        .mapping-stats {
          grid-template-columns:
            1fr 1fr;
        }

      }

    `}</style>
  );
}