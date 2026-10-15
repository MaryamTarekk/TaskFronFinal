import React, { memo, useState, useEffect, useRef } from 'react';

function TaskRow({
  task,
  isSelected,
  onToggleSelect,
  onStockChange,
  onNoteChange,
}) {
  // Local states for inputs to allow smooth, instant typing (backspace, editing digits, etc.)
  const [localStock, setLocalStock] = useState(task.stockUnits);
  const [localNotes, setLocalNotes] = useState(task.notes ?? '');

  // Track whether the user is actively focused on an input so external re-renders don't freeze/override typing
  const isStockFocused = useRef(false);
  const isNotesFocused = useRef(false);

  // Debounce timer refs
  const stockDebounceTimer = useRef(null);
  const notesDebounceTimer = useRef(null);

  // Sync props to local state only when not actively typing/focused
  useEffect(() => {
    if (!isStockFocused.current) {
      setLocalStock(task.stockUnits);
    }
  }, [task.stockUnits]);

  useEffect(() => {
    if (!isNotesFocused.current) {
      setLocalNotes(task.notes ?? '');
    }
  }, [task.notes]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (stockDebounceTimer.current) clearTimeout(stockDebounceTimer.current);
      if (notesDebounceTimer.current) clearTimeout(notesDebounceTimer.current);
    };
  }, []);

  // Commit stock change to parent and server
  const commitStock = (rawVal) => {
    const parsed = parseInt(rawVal, 10);
    const validVal = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setLocalStock(validVal);
    onStockChange(task.id, validVal);
  };

  const handleStockChange = (e) => {
    const rawVal = e.target.value;
    setLocalStock(rawVal);

    if (stockDebounceTimer.current) clearTimeout(stockDebounceTimer.current);

    // If valid non-negative number, debounce commit (450ms)
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      stockDebounceTimer.current = setTimeout(() => {
        onStockChange(task.id, parsed);
      }, 450);
    }
  };

  const handleStockFocus = () => {
    isStockFocused.current = true;
  };

  const handleStockBlur = () => {
    isStockFocused.current = false;
    if (stockDebounceTimer.current) clearTimeout(stockDebounceTimer.current);
    commitStock(localStock);
  };

  const handleNotesChange = (e) => {
    const rawVal = e.target.value;
    setLocalNotes(rawVal);

    if (notesDebounceTimer.current) clearTimeout(notesDebounceTimer.current);

    notesDebounceTimer.current = setTimeout(() => {
      onNoteChange(task.id, rawVal);
    }, 450);
  };

  const handleNotesFocus = () => {
    isNotesFocused.current = true;
  };

  const handleNotesBlur = () => {
    isNotesFocused.current = false;
    if (notesDebounceTimer.current) clearTimeout(notesDebounceTimer.current);
    onNoteChange(task.id, localNotes);
  };

  const handleRowClick = (e) => {
    // Don't toggle selection if user clicked inside input or interactive control
    if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) {
      return;
    }
    onToggleSelect(task.id);
  };

  return (
    <tr
      className={`task-row ${isSelected ? 'selected' : ''}`}
      onClick={handleRowClick}
    >
      <td className="center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(task.id)}
          aria-label={`Select task ${task.id}`}
        />
      </td>

      <td className="mono strong task-id">{task.id}</td>
      <td className="task-title">{task.title}</td>
      <td className="muted task-cat">{task.category}</td>

      <td>
        <span className={`pill ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </td>

      <td>
        <span className={`status ${task.status.replace(/\s+/g, '').toLowerCase()}`}>
          {task.status}
        </span>
      </td>

      <td>
        <input
          className="units"
          type="number"
          min="0"
          step="1"
          value={localStock}
          onChange={handleStockChange}
          onFocus={handleStockFocus}
          onBlur={handleStockBlur}
          aria-label={`Stock units for ${task.id}`}
        />
      </td>

      <td>
        <input
          className="note"
          type="text"
          value={localNotes}
          placeholder="Quick manager note..."
          onChange={handleNotesChange}
          onFocus={handleNotesFocus}
          onBlur={handleNotesBlur}
          aria-label={`Notes for ${task.id}`}
        />
      </td>
    </tr>
  );
}

export default memo(TaskRow);
