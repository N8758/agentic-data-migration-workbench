import { useCallback, useState } from "react";

import {
  runDryRun,
  executeMigration as executeMigrationApi,
  retryMigration as retryMigrationApi,
  rollbackMigration as rollbackMigrationApi,
  getQuarantineRecords,
  getReconciliation,
} from "../api/migrationApi";

export function useMigration() {
  const [dryRun, setDryRun] = useState(null);
  const [migration, setMigration] = useState(null);
  const [quarantine, setQuarantine] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ---------------------------------------------------------
  // DRY RUN
  // ---------------------------------------------------------

  const performDryRun = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await runDryRun(payload);

      setDryRun(result);

      return result;
    } catch (err) {
      const message =
        err?.message || "Dry run failed";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // EXECUTE MIGRATION
  // ---------------------------------------------------------

  const execute = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeMigrationApi(payload);

      setMigration(result);

      return result;
    } catch (err) {
      const message =
        err?.message || "Migration execution failed";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // RETRY MIGRATION
  // ---------------------------------------------------------

  const retry = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryMigrationApi(id);

      setMigration(result);

      return result;
    } catch (err) {
      const message =
        err?.message || "Migration retry failed";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // ROLLBACK MIGRATION
  // ---------------------------------------------------------

  const rollback = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const result = await rollbackMigrationApi(id);

      setMigration(result);

      return result;
    } catch (err) {
      const message =
        err?.message || "Migration rollback failed";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // QUARANTINE
  // ---------------------------------------------------------

  const loadQuarantine = useCallback(async (runId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getQuarantineRecords(runId);

      setQuarantine(result);

      return result;
    } catch (err) {
      const message =
        err?.message ||
        "Failed to load quarantine records";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // RECONCILIATION
  // ---------------------------------------------------------

  const loadReconciliation = useCallback(async (runId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getReconciliation(runId);

      setReconciliation(result);

      return result;
    } catch (err) {
      const message =
        err?.message ||
        "Failed to load reconciliation";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // CLEAR STATE
  // ---------------------------------------------------------

  const clearMigrationState = useCallback(() => {
    setDryRun(null);
    setMigration(null);
    setQuarantine(null);
    setReconciliation(null);
    setError(null);
  }, []);

  // ---------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------

  return {
    dryRun,
    migration,
    quarantine,
    reconciliation,

    loading,
    error,

    performDryRun,

    // Names expected by MigrationPage.jsx
    executeMigration: execute,
    retryMigration: retry,
    rollbackMigration: rollback,

    loadQuarantine,
    loadReconciliation,

    clearMigrationState,
  };
}

export default useMigration;