import React, { useRef, useEffect } from 'react';
import TaskRow from './TaskRow.jsx';

export default function TaskTable({
  tasks,
  selectedTaskIds,
  onToggleSelect,
  onSelectAllVisible,
  onClearSelection,
  onStockChange,
  onNoteChange,
  isSearching,
}) {
  const masterCheckboxRef = useRef(null);

  const visibleCount = tasks.length;
  const visibleSelectedCount = tasks.filter((t) => selectedTaskIds.includes(t.id)).length;
  const isAllVisibleSelected = visibleCount > 0 && visibleSelectedCount === visibleCount;
  const isPartiallySelected = visibleSelectedCount > 0 && visibleSelectedCount < visibleCount;

  // Handle indeterminate checkbox state via DOM property
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  const handleMasterCheckboxChange = () => {
    if (isAllVisibleSelected) {
      onClearSelection();
    } else {
      onSelectAllVisible();
    }
  };

  return (
    <section className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th className="center select-col">
              <input
                ref={masterCheckboxRef}
                type="checkbox"
                checked={isAllVisibleSelected}
                onChange={handleMasterCheckboxChange}
                aria-label="Select or deselect all visible tasks"
                title={isAllVisibleSelected ? 'Deselect all visible' : 'Select all visible'}
              />
            </th>
            <th>Task ID</th>
            <th>Operational Item</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Units</th>
            <th>Field Dispatch Notes</th>
          </tr>
        </thead>

        <tbody>
          {isSearching && tasks.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty">
                <div className="empty-state">
                  <div className="spinner"></div>
                  <p>Searching &amp; loading tasks from server...</p>
                </div>
              </td>
            </tr>
          ) : tasks.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty">
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                  <p className="strong">No tasks found</p>
                  <p className="muted small">No tasks match your current search query or filter criteria.</p>
                </div>
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isSelected={selectedTaskIds.includes(task.id)}
                onToggleSelect={onToggleSelect}
                onStockChange={onStockChange}
                onNoteChange={onNoteChange}
              />
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
