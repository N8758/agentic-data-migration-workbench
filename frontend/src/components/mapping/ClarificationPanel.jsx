import { useState } from "react";
import Badge from "../common/Badge";
import Button from "../common/Button";

export default function ClarificationPanel({
  questions = [],
  onSubmit,
  disabled = false,
}) {
  const items = Array.isArray(questions)
    ? questions
    : [];

  const [answers, setAnswers] = useState({});

  const updateAnswer = (index, value) => {
    setAnswers((previous) => ({
      ...previous,
      [index]: value,
    }));
  };

  const handleSubmit = () => {
    if (!onSubmit) return;

    const response = items.map((question, index) => ({
      question:
        typeof question === "string"
          ? question
          : question.question ||
            question.text ||
            question.title ||
            "",
      answer: answers[index] || "",
    }));

    onSubmit(response);
  };

  return (
    <section className="content-card clarification-panel">
      <div className="card-header">
        <div>
          <span className="page-eyebrow">AI REVIEW</span>
          <h2>Clarification Required</h2>
          <p>
            Answer these questions before finalizing the migration plan.
          </p>
        </div>

        <Badge variant={items.length ? "warning" : "success"}>
          {items.length
            ? `${items.length} Questions`
            : "No Questions"}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="clarification-empty">
          <div className="clarification-empty-icon">
            ✓
          </div>

          <h3>No clarification required</h3>

          <p>
            The migration agent has enough information to
            prepare the current mapping plan.
          </p>
        </div>
      ) : (
        <>
          <div className="clarification-list">
            {items.map((question, index) => {
              const text =
                typeof question === "string"
                  ? question
                  : question.question ||
                    question.text ||
                    question.title ||
                    `Question ${index + 1}`;

              const field =
                typeof question === "object"
                  ? question.field ||
                    question.source_field ||
                    question.target_field
                  : null;

              return (
                <div
                  className="clarification-item"
                  key={
                    question.id ||
                    `${text}-${index}`
                  }
                >
                  <div className="clarification-number">
                    {index + 1}
                  </div>

                  <div className="clarification-content">
                    <div className="clarification-question-header">
                      <h3>{text}</h3>

                      {field && (
                        <Badge variant="info">
                          {field}
                        </Badge>
                      )}
                    </div>

                    <textarea
                      value={answers[index] || ""}
                      onChange={(event) =>
                        updateAnswer(
                          index,
                          event.target.value
                        )
                      }
                      placeholder="Enter your clarification..."
                      rows={4}
                      disabled={disabled}
                      className="clarification-input"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="clarification-actions">
            <span>
              {Object.values(answers).filter(
                (value) => value.trim()
              ).length}{" "}
              of {items.length} answered
            </span>

            <Button
              onClick={handleSubmit}
              disabled={
                disabled ||
                items.some(
                  (_, index) =>
                    !answers[index]?.trim()
                )
              }
            >
              Submit Clarifications
            </Button>
          </div>
        </>
      )}
    </section>
  );
}