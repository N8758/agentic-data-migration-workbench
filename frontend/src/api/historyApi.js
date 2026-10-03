import apiClient from "./client";

export const getHistory = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiClient.get(
    query ? `/api/history?${query}` : "/api/history"
  );
};

export const getHistoryById = (id) => {
  if (!id) {
    throw new Error("History ID is required");
  }

  return apiClient.get(`/api/history/${id}`);
};