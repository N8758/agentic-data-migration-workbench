import { useCallback, useEffect, useState } from "react";
import {
  getSourceSchema,
  getTargetSchema,
} from "../api/schemaApi";

export function useSchemas(autoLoad = true) {
  const [sourceSchema, setSourceSchema] = useState(null);
  const [targetSchema, setTargetSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [source, target] = await Promise.all([
        getSourceSchema(),
        getTargetSchema(),
      ]);

      setSourceSchema(source);
      setTargetSchema(target);

      return {
        source,
        target,
      };
    } catch (err) {
      const message = err?.message || "Failed to load schemas";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    loadSchemas().catch(() => {});
  }, [autoLoad, loadSchemas]);

  return {
    sourceSchema,
    targetSchema,
    loading,
    error,
    loadSchemas,
    hasSchemas: Boolean(sourceSchema && targetSchema),
  };
}

export default useSchemas;