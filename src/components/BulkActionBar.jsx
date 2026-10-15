import React from 'react';

export default function BulkActionBar({
  selectedCount,
  visibleSelectedCount,
  visibleCount,
  onClearSelection,
  onSelectAllVisible,
  onBulkRestock,
  onBulkComplete,
  isProcessing,
}) {
  const allVisibleSelected = visibleCount > 0 && visibleSelectedCount === visibleCount;

  return (
    <section className="bulkbar">
      <div className="bulkbar-info">
        <span>
          <strong>{selectedCount}</strong> task{selectedCount === 1 ? '' : 's'} selected
          {selectedCount > 0 && visibleSelectedCount !== selectedCount && (
            <span className="muted small"> ({visibleSelectedCount} in current view)</span>
          )}
        </span>

        {selectedCount > 0 && (
          <button
            type="button"
            className="btn-link"
            onClick={onClearSelection}
          >
            Clear selection
          </button>
        )}

        {visibleCount > 0 && !allVisibleSelected && (
          <button
            type="button"
            className="btn-link"
            onClick={onSelectAllVisible}
          >
            Select all visible ({visibleCount})
          </button>
        )}
      </div>

      <div className="actions">
        <button
          id="btn-bulk-restock"
          className="btn ghost"
          onClick={onBulkRestock}
          disabled={selectedCount === 0 || isProcessing}
          title={selectedCount === 0 ? 'Select tasks first' : `Add 10 units to all ${selectedCount} selected tasks`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Restock +10 ({selectedCount})
        </button>

        <button
          id="btn-bulk-complete"
          className="btn ok"
          onClick={onBulkComplete}
          disabled={selectedCount === 0 || isProcessing}
          title={selectedCount === 0 ? 'Select tasks first' : `Mark all ${selectedCount} selected tasks as completed`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Mark Complete ({selectedCount})
        </button>
      </div>
    </section>
  );
}
