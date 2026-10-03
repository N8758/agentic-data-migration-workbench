import apiClient from "./client";

export const generateMigrationPlan = (payload = {}) => {
  return apiClient.post("/api/agent/generate-plan", payload);
};

// Alias for existing frontend calls
export const generatePlan = generateMigrationPlan;

export const validateMapping = (payload = {}) => {
  return apiClient.post("/api/agent/validate-mapping", payload);
};

export const getAgentStatus = () => {
  return apiClient.get("/api/agent/status");
};