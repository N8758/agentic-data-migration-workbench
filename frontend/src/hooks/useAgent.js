import { useCallback, useState } from "react";
import {
  generateMigrationPlan,
  validateMapping,
} from "../api/agentApi";

export function useAgent() {
  const [plan, setPlan] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePlan = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateMigrationPlan(payload);
      setPlan(result);
      return result;
    } catch (err) {
      const message = err?.message || "Failed to generate migration plan";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validate = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await validateMapping(payload);
      setValidation(result);
      return result;
    } catch (err) {
      const message = err?.message || "Failed to validate mapping";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAgentState = useCallback(() => {
    setPlan(null);
    setValidation(null);
    setError(null);
  }, []);

  return {
    plan,
    validation,
    loading,
    error,
    generatePlan,
    validate,
    clearAgentState,
  };
}

export default useAgent;