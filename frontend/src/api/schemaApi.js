import apiClient from "./client";

export const getSourceSchema = () => {
  return apiClient.get("/api/schemas/source");
};

export const getTargetSchema = () => {
  return apiClient.get("/api/schemas/target");
};

export const getSchemas = async () => {
  const [source, target] = await Promise.all([
    getSourceSchema(),
    getTargetSchema(),
  ]);

  return {
    source,
    target,
  };
};