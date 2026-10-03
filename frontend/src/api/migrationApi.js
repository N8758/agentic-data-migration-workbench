import apiClient from "./client";

export const runDryRun = (payload = {}) => {
  return apiClient.post("/api/dry-run", payload);
};

export const getDryRun = (runId) => {
  if (!runId) {
    throw new Error("Run ID is required");
  }

  return apiClient.get(`/api/dry-run/${runId}`);
};

export const executeMigration = (payload = {}) => {
  return apiClient.post("/api/migration/execute", payload);
};

export const retryMigration = (id) => {
  if (!id) {
    throw new Error("Migration ID is required");
  }

  return apiClient.post(`/api/migration/${id}/retry`);
};

export const rollbackMigration = (id) => {
  if (!id) {
    throw new Error("Migration ID is required");
  }

  return apiClient.post(`/api/migration/${id}/rollback`);
};

export const getQuarantineRecords = (runId) => {
  if (!runId) {
    throw new Error("Run ID is required");
  }

  return apiClient.get(`/api/quarantine/${runId}`);
};

export const getReconciliation = (runId) => {
  if (!runId) {
    throw new Error("Run ID is required");
  }

  return apiClient.get(`/api/reconciliation/${runId}`);
};