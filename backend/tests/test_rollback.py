from app.migration.rollback import MigrationRollback


def test_rollback_empty_run():
    rollback = MigrationRollback()

    result = rollback.rollback(
        run_id="non-existent-run",
    )

    assert isinstance(result, dict)
    assert result.get("success", True) is True


def test_rollback_returns_run_id():
    rollback = MigrationRollback()

    result = rollback.rollback(
        run_id="test-run-1",
    )

    assert isinstance(result, dict)
    assert result.get("run_id") == "test-run-1"