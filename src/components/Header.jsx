import React from 'react';

export default function Header({
  historyCount,
  onUndo,
  onSortByPriority,
  sortDirection,
  onReverse,
}) {
  return (
    <header className="topbar">
      <div className="topbar-info">
        <div className="brand-badge">OPS DISPATCH</div>
        <h1>Inventory &amp; Operations Dispatch</h1>
        <p className="muted">
          Warehouse maintenance schedules, restock audits, and field units.
        </p>
      </div>

      <div className="actions">
        <button
          id="btn-undo"
          className="btn ghost"
          onClick={onUndo}
          disabled={historyCount === 0}
          title={historyCount === 0 ? 'No actions to undo' : `Undo last action (${historyCount} available)`}
        >
          <svg className="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Undo ({historyCount})
        </button>

        <button
          id="btn-sort-priority"
          className="btn primary"
          onClick={onSortByPriority}
          title="Sort tasks by priority"
        >
          <svg className="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
          Sort by Priority {sortDirection === 'asc' ? '↑ (Low to Urgent)' : '↓ (Urgent to Low)'}
        </button>

        <button
          id="btn-reverse"
          className="btn secondary"
          onClick={onReverse}
          title="Reverse current task list order"
        >
          <svg className="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="21 16 21 21 16 21"></polyline>
            <line x1="15" y1="15" x2="21" y2="21"></line>
            <line x1="4" y1="4" x2="9" y2="9"></line>
          </svg>
          Reverse Order
        </button>
      </div>
    </header>
  );
}
