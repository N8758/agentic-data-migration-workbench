# Agentic Data Migration Workbench — README

## 1. Project Overview

The **Agentic Data Migration Workbench** is an AI-assisted data migration application designed to help users:

1. Inspect source and target schemas.
2. Inspect source records.
3. Generate an AI-assisted migration mapping plan.
4. Validate mappings deterministically and with AI.
5. Approve a migration plan.
6. Perform a dry run without writing to the target database.
7. Execute the migration.
8. Quarantine invalid records.
9. Reconcile source and target results.
10. Retry failed migrations.
11. Roll back migrations when required.
12. Review migration history and audit activity.

The system contains a **React frontend** and a **FastAPI backend**.

---

# 2. High-Level Architecture

```text
React Frontend
     |
     | HTTP / JSON
     v
FastAPI Backend
     |
     +----------------------+
     |                      |
     v                      v
AI Service             Migration Services
     |                      |
     +----------+-----------+
                |
                v
        Source / Target Data
                |
                v
          PostgreSQL DB
```

The normal workflow is:

```text
Generate Plan
     ↓
Review Mapping
     ↓
Save/Create Plan
     ↓
Approve Plan
     ↓
Dry Run
     ↓
Execute Migration
     ↓
Reconcile
     ↓
Retry / Rollback if required
```

---

# 3. Backend Structure

A typical backend structure is:

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── agent.py
│   │   │   ├── dry_run.py
│   │   │   ├── migration.py
│   │   │   ├── quarantine.py
│   │   │   ├── reconciliation.py
│   │   │   ├── history.py
│   │   │   ├── health.py
│   │   │   └── schemas.py
│   │   └── plans.py
│   ├── ai/
│   │   ├── service.py
│   │   ├── schemas.py
│   │   ├── prompts.py
│   │   ├── tools.py
│   │   ├── base_provider.py
│   │   ├── gemini_provider.py
│   │   └── groq_provider.py
│   ├── migration/
│   │   ├── mapper.py
│   │   └── dry_runner.py
│   ├── models/
│   │   └── migration_plan.py
│   ├── repositories/
│   │   ├── plan_repository.py
│   │   ├── migration_repository.py
│   │   └── audit_repository.py
│   └── core/
│       ├── config.py
│       └── database.py
├── data/
│   ├── source_schema.json
│   ├── target_schema.json
│   ├── source_records.json
│   └── transformation_rules.json
└── .env
```

The exact project may contain additional files.

---

# 4. Frontend Structure

The frontend contains pages, components, API clients, and hooks.

Typical structure:

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.js
│   │   └── migrationApi.js
│   ├── hooks/
│   │   └── useMigration.js
│   ├── pages/
│   │   ├── MappingPage.jsx
│   │   ├── DryRunPage.jsx
│   │   └── ...
│   └── components/
│       └── common/
│           ├── Button.jsx
│           ├── Badge.jsx
│           ├── Loader.jsx
│           └── ErrorMessage.jsx
```

---

# 5. Important Backend Routes

The application currently exposes routes including:

```text
POST /api/agent/generate-plan

GET  /api/plans
POST /api/plans
GET  /api/plans/{plan_id}
POST /api/plans/{plan_id}/approve
POST /api/plans/{plan_id}/reject

POST /api/dry-run
GET  /api/dry-run/{run_id}

Migration routes:
POST /api/migration/execute
POST /api/migration/{id}/retry
POST /api/migration/{id}/rollback

Quarantine:
GET /api/quarantine/{run_id}

Reconciliation:
GET /api/reconciliation/{run_id}
```

The exact route prefixes should always be checked against `main.py` and the individual route modules.

---

# 6. Application Startup

The backend starts through Uvicorn:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Expected startup output includes:

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

A `KeyboardInterrupt` / `CancelledError` during shutdown normally indicates that the server was stopped, for example with `CTRL+C`. It is not by itself evidence of a migration-plan bug.

---

# 7. Database Layer

The project uses SQLAlchemy's asynchronous database engine.

The database URL is converted to an async PostgreSQL URL:

```text
postgresql://
        ↓
postgresql+asyncpg://
```

The application creates:

```python
engine = create_async_engine(...)
```

and:

```python
AsyncSessionLocal = async_sessionmaker(...)
```

The database dependency is:

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        ...
```

Important:

The repository layer therefore needs to use the same asynchronous session style consistently.

---

# 8. Migration Plan Model

The migration plan model contains:

```text
id
name
description
source_name
target_name
current_version
status
created_at
updated_at
```

The `id` is a PostgreSQL UUID generated using:

```python
default=uuid.uuid4
```

The model also contains relationships to migration plan versions and migration runs.

Example conceptual record:

```json
{
  "id": "UUID",
  "name": "Customer Migration",
  "source_name": "legacy_customers",
  "target_name": "users",
  "current_version": 1,
  "status": "approved"
}
```

---

# 9. Migration Plan Lifecycle

A migration plan normally moves through states such as:

```text
draft
  ↓
approved
  ↓
dry_run_completed
  ↓
executed
```

A rejected plan may become:

```text
rejected
```

The exact allowed statuses are determined by the repository/routes/database implementation.

---

# 10. AI Plan Generation

The AI service loads:

```text
Source Schema
Target Schema
Source Records
Transformation Rules
```

The data is passed to an AI provider through a structured prompt.

The service supports a primary provider and a fallback provider.

Conceptually:

```text
Primary AI Provider
       |
       | failure
       v
Fallback AI Provider
```

The generated result is validated through Pydantic models.

---

# 11. AI Migration Plan Schema

The generated migration plan contains:

```text
summary
mappings
transformations
risks
clarification_questions
overall_confidence
assumptions
```

Each mapping contains:

```text
source_field
target_field
transformation
confidence
risk_level
reasoning
```

Example:

```json
{
  "source_field": "customer_id",
  "target_field": "user_id",
  "transformation": "rename_field",
  "confidence": 1.0,
  "risk_level": "low",
  "reasoning": "Integer ID maps directly with a rename."
}
```

---

# 12. Mapping Validation

The project uses deterministic validation through:

```python
validate_mapping(...)
```

The AI service also performs AI-assisted validation.

The combined validation concept is:

```text
Deterministic Validation
        AND
AI Validation
        =
Final Validation
```

The deterministic validator should remain the source of truth for hard structural rules.

---

# 13. Plan Generation API

The frontend can call:

```http
POST /api/agent/generate-plan
```

The route creates an `AIService` and calls:

```python
service.generate_migration_plan()
```

The response has the general structure:

```json
{
  "success": true,
  "plan": {
    "summary": "...",
    "mappings": [],
    "transformations": [],
    "risks": [],
    "clarification_questions": [],
    "overall_confidence": 0.95,
    "assumptions": []
  },
  "validation": {},
  "tools_used": []
}
```

---

# 14. Critical Plan ID Concept

The **plan ID** is the identifier of a persisted migration plan.

It is different from:

```text
run_id
```

A useful distinction is:

```text
plan_id = identifies the migration plan

run_id = identifies a migration execution/dry-run instance
```

For example:

```text
Plan:
plan_id = 123e4567-...

Dry Run:
run_id = 987e6543-...
```

Do not silently use `run_id` where the backend expects `plan_id`.

---

# 15. Why "plan_id is required" Happens

The dry-run endpoint explicitly reads:

```python
plan_id = payload.get("plan_id")
```

If it is missing:

```python
if not plan_id:
    raise HTTPException(
        status_code=400,
        detail="plan_id is required."
    )
```

Therefore a request like:

```json
{}
```

or:

```json
{
  "mappings": [...]
}
```

causes:

```text
400 Bad Request
plan_id is required.
```

The frontend must send the ID of the saved/approved migration plan.

---

# 16. Critical Dry-Run Requirement

The dry-run endpoint requires:

```text
plan_id
```

and then loads that plan from the database.

It also checks:

```text
plan exists
AND
plan.status == "approved"
```

If the plan does not exist:

```text
404 Migration plan not found.
```

If the plan exists but is not approved:

```text
400 Migration plan must be approved before dry run.
```

Therefore the complete dry-run prerequisite is:

```text
Generate Plan
      ↓
Create/Save Plan
      ↓
Receive plan_id
      ↓
Approve Plan
      ↓
Call Dry Run with plan_id
```

---

# 17. Correct Dry-Run Request Shape

The frontend should ultimately send something conceptually like:

```json
{
  "plan_id": "YOUR-SAVED-PLAN-UUID",
  "mappings": [
    {
      "source_field": "customer_id",
      "target_field": "user_id",
      "transformation": "rename_field"
    }
  ]
}
```

If the backend is designed to obtain mappings from the persisted plan, the request can contain only the required plan identifier:

```json
{
  "plan_id": "YOUR-SAVED-PLAN-UUID"
}
```

The exact choice depends on how the persisted `MigrationPlan` stores mappings.

---

# 18. Important Frontend API Detail

The frontend API client contains:

```javascript
export const runDryRun = (payload = {}) => {
  return apiClient.post("/api/dry-run", payload);
};
```

This means the API client does not automatically create a `plan_id`.

It sends exactly what the caller provides.

Therefore:

```javascript
runDryRun()
```

results in a request with an empty object.

That will fail because the backend requires:

```text
plan_id
```

The calling page/hook must provide the identifier.

---

# 19. Important Frontend Hook Detail

The migration hook contains:

```javascript
const performDryRun = useCallback(async (payload = {}) => {
    ...
    const result = await runDryRun(payload);
    ...
}, []);
```

This function also does not automatically discover the plan ID.

Therefore this call:

```javascript
performDryRun()
```

ultimately sends:

```json
{}
```

to:

```text
POST /api/dry-run
```

The caller should instead pass the saved plan identifier.

Conceptually:

```javascript
performDryRun({
  plan_id: savedPlanId
});
```

---

# 20. Mapping Page Responsibility

The Mapping page should manage the migration-plan workflow.

A robust flow is:

```text
1. Generate plan
2. Display mappings
3. Save plan
4. Store returned plan.id
5. Approve the plan
6. Navigate to Dry Run
7. Pass/store plan.id
```

The important point is:

**Generating an AI plan does not automatically mean a database migration plan has been persisted.**

The application needs a persisted plan record if the dry-run API expects to retrieve it by ID.

---

# 21. DryRunPage Responsibility

The Dry Run page should not blindly call:

```javascript
performDryRun()
```

without an identifier.

It should obtain the current saved plan ID from the application's state/navigation/session storage/route state, depending on the application's existing design.

Conceptually:

```javascript
const planId = ...current saved plan id...;
```

Then:

```javascript
await performDryRun({
  plan_id: planId
});
```

If the plan ID is missing, the page should display a clear message instead of sending an empty request.

---

# 22. API Client

The API client currently contains:

```javascript
runDryRun(payload = {}) =>
    POST /api/dry-run
```

Other functions include:

```text
getDryRun(runId)
executeMigration(payload)
retryMigration(id)
rollbackMigration(id)
getQuarantineRecords(runId)
getReconciliation(runId)
```

These functions rely on their caller to supply the correct IDs.

---

# 23. DryRunner Data Requirement

The dry-run route loads:

```text
source_schema.json
target_schema.json
source_records.json
transformation_rules.json
```

It then calls:

```python
runner.run(
    source_records=source_records,
    mappings=mappings,
    run_id=run_id,
)
```

An important implementation detail is that `source_records` must have the shape expected by `DryRunner.run()`.

If `source_records.json` is an object like:

```json
{
  "dataset": "...",
  "records": [
    {...},
    {...}
  ]
}
```

but `DryRunner.run()` expects a list:

```python
[
  {...},
  {...}
]
```

then the route must unwrap the actual records before calling the runner.

The exact required conversion depends on the current `DryRunner.run()` implementation.

---

# 24. Dry-Run Result

The dry-run result contains counts such as:

```text
source_count
accepted_count
rejected_count
```

The route then creates or updates a migration run.

Conceptually:

```text
source_count
accepted_count
rejected_count
        ↓
migration_runs
        ↓
audit log
```

The response contains:

```json
{
  "success": true,
  "plan_id": "...",
  "run": {},
  "dry_run": {}
}
```

---

# 25. Dry-Run Page Display

The Dry Run page can display:

```text
Source Records
Accepted
Rejected
Quarantined
```

It can also display record-level validation results.

The frontend should distinguish between:

```text
plan_id
```

and:

```text
run_id
```

The plan ID identifies the migration plan.

The run ID identifies a particular dry-run/execution instance.

---

# 26. Plan Repository

The repository is intended to use an asynchronous SQLAlchemy session:

```python
AsyncSession
```

Its methods are asynchronous:

```text
create()
get_by_id()
get_all()
update()
delete()
create_version()
get_versions()
approve()
reject()
mark_executed()
```

Because these methods use:

```python
await self.db.commit()
await self.db.refresh(...)
```

callers must use:

```python
await repository.method(...)
```

when using the asynchronous repository implementation.

---

# 27. Important Async/Sync Consistency Check

The supplied project files show a potential integration issue when a route imports:

```python
from sqlalchemy.orm import Session
```

and then passes that session into a repository that expects:

```python
AsyncSession
```

The following combination is inconsistent:

```python
def route(db: Session = Depends(get_db)):
```

with:

```python
class PlanRepository:
    def __init__(self, db: AsyncSession):
```

and:

```python
await self.db.commit()
```

The application should use one consistent database access pattern.

For the current async `database.py` and async `PlanRepository`, the route should use the async session pattern.

This must be corrected consistently rather than mixing synchronous and asynchronous SQLAlchemy APIs.

---

# 28. Migration Plan Persistence

Creating a plan conceptually looks like:

```text
POST /api/plans
```

The backend creates a `MigrationPlan` record.

The response contains:

```json
{
  "success": true,
  "plan": {
    "id": "...",
    ...
  }
}
```

The frontend should preserve:

```text
plan.id
```

for later operations.

This identifier is the value required by:

```text
POST /api/dry-run
```

---

# 29. Plan Approval

Approval is performed through:

```text
POST /api/plans/{plan_id}/approve
```

The backend checks the plan exists and then changes its status to:

```text
approved
```

Only after this should the dry-run route proceed.

---

# 30. Common Failure: Generated Plan vs Saved Plan

A frequent source of confusion is treating this:

```text
AI generated plan
```

as if it were this:

```text
database migration plan
```

They are not necessarily the same object.

AI generation returns a proposal.

The application then needs to persist the proposal if later APIs require:

```text
plan_id
```

Correct conceptual flow:

```text
AI Proposal
    ↓
User Review
    ↓
Create MigrationPlan DB record
    ↓
plan.id
    ↓
Approve
    ↓
Dry Run
```

---

# 31. Common Failure: Empty Dry-Run Payload

Bad:

```javascript
performDryRun();
```

This becomes:

```http
POST /api/dry-run
```

with:

```json
{}
```

Backend response:

```text
400
plan_id is required.
```

Correct concept:

```javascript
performDryRun({
  plan_id: planId
});
```

---

# 32. Common Failure: Wrong Identifier

Do not confuse:

```text
plan.id
```

with:

```text
run.id
```

For example:

```text
Generate plan
→ plan.id = A

Dry run
→ run.id = B
```

The first dry-run request requires:

```text
plan_id = A
```

The resulting dry-run record can have:

```text
run_id = B
```

Later:

```text
GET /api/dry-run/B
```

uses the run ID.

---

# 33. Common Failure: Plan Not Approved

Even if the correct plan ID is sent, this fails:

```text
plan.status != approved
```

The backend intentionally blocks the dry run.

The required order is:

```text
Create plan
→ Approve plan
→ Dry run
```

---

# 34. Common Failure: Plan Does Not Exist

If the frontend sends an ID that is not in the database:

```text
POST /api/dry-run
{
  "plan_id": "wrong-id"
}
```

the backend returns:

```text
404 Migration plan not found.
```

This means the frontend has an identifier, but it is not the identifier of an existing migration plan.

---

# 35. Common Failure: Frontend State Lost

If the plan ID exists only in React state:

```javascript
const [planId, setPlanId] = useState(null);
```

and the user navigates to another page, the state may be lost when the component is unmounted.

A stable application can preserve the ID using the project's chosen navigation/state strategy, for example:

```text
route state
sessionStorage
application context
global state
URL parameter
```

The implementation should use one consistent strategy.

---

# 36. Recommended Debugging Order

When dry run returns:

```text
400 Bad Request
```

check the browser Network request first.

Look at:

```text
Request URL
Request Method
Request Payload
Response Body
```

For this specific error, verify that the payload contains:

```json
{
  "plan_id": "..."
}
```

Then check:

```text
1. Does this ID exist in the database?
2. What is its status?
3. Is the status approved?
```

---

# 37. Fast Debugging Checklist

## Step 1 — Browser Network

Open:

```text
DevTools
→ Network
→ POST /api/dry-run
→ Payload
```

Expected:

```json
{
  "plan_id": "some-uuid"
}
```

If the payload is:

```json
{}
```

the problem is in the frontend call.

---

## Step 2 — Check the plan ID

The generated/saved plan response should contain:

```json
{
  "plan": {
    "id": "..."
  }
}
```

Store that exact ID.

---

## Step 3 — Approve the same ID

Call:

```text
POST /api/plans/{that-id}/approve
```

---

## Step 4 — Dry Run

Send:

```json
{
  "plan_id": "that-same-id"
}
```

---

## Step 5 — Check Backend

If the backend says:

```text
plan_id is required
```

the ID was not sent.

If it says:

```text
Migration plan not found
```

the ID was sent but does not exist.

If it says:

```text
Migration plan must be approved before dry run
```

the ID exists but the plan is not approved.

---

# 38. Frontend Hook Pattern

The migration hook should remain responsible for API state.

A safe usage pattern is:

```javascript
const handleRun = async () => {
  if (!planId) {
    setError("Migration plan ID is missing.");
    return;
  }

  await performDryRun({
    plan_id: planId,
  });
};
```

The exact location of `planId` depends on how the Mapping page stores the saved plan.

---

# 39. Do Not Fix Only the Button

Changing:

```javascript
<Button>
```

or:

```javascript
onClick={handleRun}
```

alone does not solve the backend contract.

The complete chain must be correct:

```text
MappingPage
    ↓
saved plan response
    ↓
plan.id
    ↓
DryRunPage
    ↓
performDryRun({ plan_id })
    ↓
runDryRun(payload)
    ↓
POST /api/dry-run
    ↓
payload.plan_id
    ↓
database lookup
```

A missing value anywhere in this chain causes the problem.

---

# 40. Current Important Files

For debugging the plan-ID/dry-run problem, inspect these files in this order:

```text
1. frontend/src/pages/MappingPage.jsx
2. frontend/src/pages/DryRunPage.jsx
3. frontend/src/hooks/useMigration.js
4. frontend/src/api/migrationApi.js
5. backend/app/api/routes/dry_run.py
6. backend/app/api/routes/plans.py
7. backend/app/repositories/plan_repository.py
8. backend/app/models/migration_plan.py
9. backend/app/ai/service.py
10. backend/app/api/routes/agent.py
```

The most important files for the `plan_id is required` error are:

```text
MappingPage.jsx
DryRunPage.jsx
useMigration.js
migrationApi.js
dry_run.py
plans.py
```

---

# 41. Data Contract

The application should maintain this contract:

### Generate

```text
POST /api/agent/generate-plan
```

returns an AI proposal.

### Save

```text
POST /api/plans
```

returns:

```text
plan.id
```

### Approve

```text
POST /api/plans/{plan.id}/approve
```

### Dry Run

```text
POST /api/dry-run

{
  "plan_id": plan.id
}
```

### Result

```text
run.id
```

### Read Dry Run

```text
GET /api/dry-run/{run.id}
```

---

# 42. Important Terminology

| Term | Meaning |
|---|---|
| `source_schema` | Definition of source fields |
| `target_schema` | Definition of target fields |
| `source_records` | Source migration data |
| `mappings` | Source-to-target field mapping |
| `transformation_rules` | Supported data transformations |
| `AI proposal` | Plan generated by AI |
| `plan_id` | Identifier of persisted migration plan |
| `run_id` | Identifier of a migration/dry-run execution |
| `accepted_count` | Records accepted by validation |
| `rejected_count` | Records rejected by validation |
| `quarantine` | Storage/handling of rejected records |
| `reconciliation` | Comparison of source and target results |

---

# 43. Production-Quality Principles

The application should:

1. Never execute a migration without an approved plan.
2. Never assume a generated AI proposal has been persisted.
3. Never confuse `plan_id` and `run_id`.
4. Validate request payloads before executing migrations.
5. Preserve the plan ID through navigation.
6. Keep deterministic validation separate from AI reasoning.
7. Log migration actions.
8. Track migration runs independently from plans.
9. Preserve rejected records for investigation.
10. Provide reconciliation after execution.
11. Keep database session usage consistent.
12. Return clear API errors.

---

# 44. Troubleshooting Matrix

| Error | Meaning | First place to check |
|---|---|---|
| `400 plan_id is required` | Request has no `plan_id` | Mapping/DryRun frontend |
| `404 Migration plan not found` | ID does not exist | Saved plan/API response |
| `400 plan must be approved` | Plan status is not approved | Approval flow |
| `400 mappings must be a list` | Mapping payload is wrong type | Frontend/API payload |
| `404 Migration run not found` | Wrong `run_id` | Dry-run result/navigation |
| `400 Bad Request` | Backend rejected request contract | Network payload + route |
| `500 AI provider failed` | AI provider pipeline failed | `ai/service.py` + provider |
| `500 Invalid JSON` | Data JSON cannot be parsed | `data/*.json` |
| DryRunner type error | Data shape does not match runner | `source_records.json` + `dry_runner.py` |
| SQLAlchemy async error | Sync/async session mismatch | `database.py`, routes, repositories |

---

# 45. Final End-to-End Flow

The intended complete workflow is:

```text
                    ┌───────────────────┐
                    │ Generate AI Plan  │
                    └─────────┬─────────┘
                              │
                              v
                    ┌───────────────────┐
                    │ Review Mappings   │
                    └─────────┬─────────┘
                              │
                              v
                    ┌───────────────────┐
                    │ Save Migration    │
                    │ Plan              │
                    └─────────┬─────────┘
                              │
                              │ plan.id
                              v
                    ┌───────────────────┐
                    │ Approve Plan      │
                    └─────────┬─────────┘
                              │
                              v
                    ┌───────────────────┐
                    │ Dry Run           │
                    │ { plan_id }       │
                    └─────────┬─────────┘
                              │
                              │ run.id
                              v
                    ┌───────────────────┐
                    │ Review Results    │
                    └─────────┬─────────┘
                              │
                              v
                    ┌───────────────────┐
                    │ Execute Migration │
                    └─────────┬─────────┘
                              │
                              v
                    ┌───────────────────┐
                    │ Reconciliation    │
                    └─────────┬─────────┘
                              │
                     ┌────────┴────────┐
                     v                 v
                  Success           Failure
                                       │
                              ┌────────┴────────┐
                              v                 v
                           Retry             Rollback
```

---

# 46. Key Fix Target for the Current `plan_id` Problem

If the current error is:

```text
POST /api/dry-run
400 Bad Request
plan_id is required.
```

do **not** start by changing:

```text
Button.jsx
database.py
AI schemas
AI provider
```

The first thing to verify is the frontend request payload.

The critical call chain is:

```text
MappingPage.jsx
        ↓
plan.id
        ↓
DryRunPage.jsx
        ↓
performDryRun({
    plan_id: planId
})
        ↓
runDryRun(payload)
        ↓
POST /api/dry-run
```

If `plan_id` is absent in the browser Network payload, the issue is before the backend validation.

If `plan_id` is present, then inspect:

```text
dry_run.py
→ PlanRepository
→ MigrationPlan
→ database
```

This distinction prevents changing unrelated files.

---

# 47. Important Rule for Future Debugging

When an API returns an error, always trace:

```text
UI action
→ frontend handler
→ hook
→ API client
→ HTTP request payload
→ FastAPI route
→ validation
→ repository
→ database
```

Do not change multiple unrelated files at once.

First identify the exact point where the required value disappears.

For the current plan-ID issue, the value to trace is:

```text
plan.id
```

and the required backend field is:

```text
payload["plan_id"]
```

The two must contain the same persisted migration-plan UUID.
