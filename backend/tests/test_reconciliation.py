from app.migration.reconciliation import Reconciliation


def test_reconciliation_matches():
    reconciliation = Reconciliation()

    result = reconciliation.compare(
        source_count=10,
        accepted_count=8,
        rejected_count=2,
        target_count=8,
    )

    assert result["source_count"] == 10
    assert result["accepted_count"] == 8
    assert result["rejected_count"] == 2
    assert result["target_count"] == 8
    assert result["overall_match"] is True


def test_reconciliation_detects_mismatch():
    reconciliation = Reconciliation()

    result = reconciliation.compare(
        source_count=10,
        accepted_count=8,
        rejected_count=2,
        target_count=7,
    )

    assert result["overall_match"] is False
    assert result["accepted_vs_target"]["match"] is False


def test_reconciliation_source_processing():
    reconciliation = Reconciliation()

    result = reconciliation.compare(
        source_count=20,
        accepted_count=15,
        rejected_count=5,
        target_count=15,
    )

    assert result["source_vs_processed"]["match"] is True
    assert result["accepted_vs_target"]["match"] is True
    assert result["overall_match"] is True