import apiClient from "./client";

export const getPlans = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiClient.get(
    query ? `/api/plans?${query}` : "/api/plans"
  );
};

export const createPlan = (payload = {}) => {
  return apiClient.post("/api/plans", payload);
};

export const getPlan = (id) => {
  if (!id) {
    throw new Error("Plan ID is required");
  }

  return apiClient.get(`/api/plans/${id}`);
};

export const approvePlan = (id, payload = {}) => {
  if (!id) {
    throw new Error("Plan ID is required");
  }

  return apiClient.post(`/api/plans/${id}/approve`, payload);
};

export const rejectPlan = (id, payload = {}) => {
  if (!id) {
    throw new Error("Plan ID is required");
  }

  return apiClient.post(`/api/plans/${id}/reject`, payload);
};