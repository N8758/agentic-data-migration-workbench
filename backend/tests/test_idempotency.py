from app.migration.idempotency import IdempotencyManager


def test_same_key_is_duplicate():
    manager = IdempotencyManager()

    key = manager.generate_key(
        run_id="run-1",
        source_record_id="record-1",
    )

    assert manager.is_duplicate(key) is False

    manager.mark_processed(key)

    assert manager.is_duplicate(key) is True


def test_different_keys_are_not_duplicates():
    manager = IdempotencyManager()

    key1 = manager.generate_key(
        run_id="run-1",
        source_record_id="record-1",
    )

    key2 = manager.generate_key(
        run_id="run-1",
        source_record_id="record-2",
    )

    manager.mark_processed(key1)

    assert manager.is_duplicate(key1) is True
    assert manager.is_duplicate(key2) is False