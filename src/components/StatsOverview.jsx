import React from 'react';

export default function StatsOverview({
  visibleCount,
  totalUnits,
  lowStockCount,
  completedCount,
}) {
  return (
    <section className="grid-4 stats-grid">
      <div className="card stat">
        <span className="label">Visible Tasks</span>
        <p className="big">{visibleCount}</p>
        <span className="muted small">In current view</span>
      </div>

      <div className="card stat">
        <span className="label">Total Stock Units</span>
        <p className="big accent">{totalUnits.toLocaleString()}</p>
        <span className="muted small">Across visible items</span>
      </div>

      <div className="card stat">
        <span className="label">Low Stock Items</span>
        <p className={`big ${lowStockCount > 0 ? 'warn' : 'ok'}`}>{lowStockCount}</p>
        <span className="muted small">Threshold &lt; 15 units</span>
      </div>

      <div className="card stat">
        <span className="label">Completed</span>
        <p className="big ok">{completedCount}</p>
        <span className="muted small">Dispatched &amp; done</span>
      </div>
    </section>
  );
}
