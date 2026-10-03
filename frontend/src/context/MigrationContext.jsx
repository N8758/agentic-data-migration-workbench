import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getSourceSchema, getTargetSchema } from "../api/schemaApi";
import { generateMigrationPlan } from "../api/agentApi";
import { runDryRun, executeMigration, getReconciliation } from "../api/migrationApi";

const MigrationContext = createContext(null);

export function MigrationProvider({ children }) {
  const [sourceSchema, setSourceSchema] = useState(null);
  const [targetSchema, setTargetSchema] = useState(null);
  const [migrationPlan, setMigrationPlan] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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

      return { source, target };
    } catch (err) {
      setError(err.message || "Failed to load schemas");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePlan = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateMigrationPlan(payload);
      setMigrationPlan(result);
      return result;
    } catch (err) {
      setError(err.message || "Failed to generate migration plan");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const performDryRun = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await runDryRun(payload);
      setDryRunResult(result);
      return result;
    } catch (err) {
      setError(err.message || "Dry run failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeApprovedMigration = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeMigration(payload);
      setMigrationResult(result);
      return result;
    } catch (err) {
      setError(err.message || "Migration execution failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReconciliation = useCallback(async (runId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getReconciliation(runId);
      setReconciliation(result);
      return result;
    } catch (err) {
      setError(err.message || "Failed to load reconciliation");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetMigration = useCallback(() => {
    setSourceSchema(null);
    setTargetSchema(null);
    setMigrationPlan(null);
    setDryRunResult(null);
    setMigrationResult(null);
    setReconciliation(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      sourceSchema,
      targetSchema,
      migrationPlan,
      dryRunResult,
      migrationResult,
      reconciliation,
      loading,
      error,
      clearError,
      loadSchemas,
      generatePlan,
      performDryRun,
      executeApprovedMigration,
      loadReconciliation,
      resetMigration,
    }),
    [
      sourceSchema,
      targetSchema,
      migrationPlan,
      dryRunResult,
      migrationResult,
      reconciliation,
      loading,
      error,
      clearError,
      loadSchemas,
      generatePlan,
      performDryRun,
      executeApprovedMigration,
      loadReconciliation,
      resetMigration,
    ]
  );

  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigrationContext() {
  const context = useContext(MigrationContext);

  if (!context) {
    throw new Error(
      "useMigrationContext must be used inside MigrationProvider"
    );
  }

  return context;
}

export default MigrationContext;