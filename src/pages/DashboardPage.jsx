import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchTasks, updateTask, saveTasks } from '../api.js';
import {
  PRIORITY_WEIGHT,
  LOW_STOCK_LIMIT,
  MAX_HISTORY,
  CATEGORIES,
  PRIORITIES,
} from '../constants/taskConstants.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useUrlSync } from '../hooks/useUrlSync.js';

import Header from '../components/Header.jsx';
import AutoSaveCard from '../components/AutoSaveCard.jsx';
import PayloadPreviewCard from '../components/PayloadPreviewCard.jsx';
import StatsOverview from '../components/StatsOverview.jsx';
import Toolbar from '../components/Toolbar.jsx';
import BulkActionBar from '../components/BulkActionBar.jsx';
import TaskTable from '../components/TaskTable.jsx';

const cloneTasks = (items) => items.map((task) => ({ ...task }));

const getInitialParam = (key, fallback) => {
  try {
    return new URLSearchParams(window.location.search).get(key) || fallback;
  } catch {
    return fallback;
  }
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => getInitialParam('q', ''));
  const [categoryFilter, setCategoryFilter] = useState(() => {
    const val = getInitialParam('category', 'All');
    return CATEGORIES.includes(val) ? val : 'All';
  });
  const [priorityFilter, setPriorityFilter] = useState(() => {
    const val = getInitialParam('priority', 'All');
    return PRIORITIES.includes(val) ? val : 'All';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const [saveCount, setSaveCount] = useState(0);
  const [lastSavedPayload, setLastSavedPayload] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [saveError, setSaveError] = useState('');

  const [history, setHistory] = useState([]);
  const [sortDirection, setSortDirection] = useState('desc');

  const latestRequestId = useRef(0);
  const tasksRef = useRef(tasks);
  const selectedIdsRef = useRef(selectedTaskIds);
  const priorityFilterRef = useRef(priorityFilter);

  // Keep refs up-to-date
  tasksRef.current = tasks;
  selectedIdsRef.current = selectedTaskIds;
  priorityFilterRef.current = priorityFilter;

  // Debounce search query to prevent high-frequency requests & race conditions
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Synchronize search query, category, priority, sorting, and selected tasks with URL
  useUrlSync({
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    priorityFilter,
    setPriorityFilter,
    selectedTaskIds,
    setSelectedTaskIds,
    sortDirection,
    setSortDirection,
  });

  // Push snapshot to undo history with deduplication to prevent ghost or loop states
  const pushHistory = useCallback(() => {
    const currentTasks = cloneTasks(tasksRef.current);
    const currentSelected = [...selectedIdsRef.current];

    setHistory((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const isSameTasks =
          JSON.stringify(last.tasks) === JSON.stringify(currentTasks);
        const isSameSelection =
          JSON.stringify(last.selectedTaskIds) === JSON.stringify(currentSelected);

        // Don't push identical state - prevents "كأنه ما سوا شي" and state looping
        if (isSameTasks && isSameSelection) {
          return prev;
        }
      }
      return [...prev, { tasks: currentTasks, selectedTaskIds: currentSelected }].slice(
        -MAX_HISTORY
      );
    });
  }, []);

  // Fetch tasks with query debouncing and race-condition immunity
  useEffect(() => {
    const requestId = ++latestRequestId.current;
    let cancelled = false;

    setIsSearching(true);

    fetchTasks(debouncedSearchQuery, categoryFilter)
      .then((results) => {
        if (cancelled || requestId !== latestRequestId.current) {
          return;
        }
        setTasks(results);
      })
      .catch((error) => {
        if (!cancelled && requestId === latestRequestId.current) {
          console.error('Failed to fetch tasks:', error);
          setSaveError('Failed to fetch tasks from server.');
        }
      })
      .finally(() => {
        if (!cancelled && requestId === latestRequestId.current) {
          setIsSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, categoryFilter]);

  // Handle Save (both auto-save timer and manual "Save Now" button)
  const handleSave = useCallback(async () => {
    if (isSaving || tasksRef.current.length === 0) return;

    setIsSaving(true);
    const snapshot = cloneTasks(tasksRef.current);

    try {
      const savedTasks = await saveTasks(snapshot);

      // Keep UI state strictly synchronized with server response
      if (Array.isArray(savedTasks) && savedTasks.length > 0) {
        setTasks(savedTasks);
      }

      const timestamp = new Date().toLocaleTimeString();
      setSaveCount((count) => count + 1);
      setLastSavedAt(timestamp);
      setSaveError('');

      setLastSavedPayload({
        savedAt: timestamp,
        priorityFilter: priorityFilterRef.current,
        selectedTaskIds: [...selectedIdsRef.current],
        tasks: snapshot.map((task) => ({
          id: task.id,
          stockUnits: Number(task.stockUnits),
          status: task.status,
          notes: task.notes ?? '',
        })),
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save operation failed');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  // Undo last action cleanly with atomic restoration
  const handleUndo = useCallback(async () => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;

      const previous = prevHistory[prevHistory.length - 1];
      const restoredTasks = cloneTasks(previous.tasks);

      // Restore UI state synchronously
      setTasks(restoredTasks);
      setSelectedTaskIds([...previous.selectedTaskIds]);

      // Atomic sync to server data source
      saveTasks(restoredTasks).catch((error) => {
        setSaveError(
          error instanceof Error ? error.message : 'Undo could not be saved to server'
        );
      });

      return prevHistory.slice(0, -1);
    });
  }, []);

  // Sort by priority with secondary tie-breaker for deterministic reordering
  const handleSortByPriority = useCallback(() => {
    pushHistory();

    const nextDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDirection);
    const directionMultiplier = nextDirection === 'asc' ? 1 : -1;

    setTasks((currentTasks) =>
      [...currentTasks].sort((a, b) => {
        const weightDiff = (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * directionMultiplier;
        if (weightDiff !== 0) return weightDiff;
        // Tie-breaker by id to guarantee deterministic change
        return a.id.localeCompare(b.id) * directionMultiplier;
      })
    );
  }, [sortDirection, pushHistory]);

  // Reverse list order
  const handleReverse = useCallback(() => {
    pushHistory();
    setTasks((currentTasks) => [...currentTasks].reverse());
  }, [pushHistory]);

  // Toggle single task selection
  const handleToggleSelect = useCallback((taskId) => {
    setSelectedTaskIds((currentIds) =>
      currentIds.includes(taskId)
        ? currentIds.filter((id) => id !== taskId)
        : [...currentIds, taskId]
    );
  }, []);

  // Filter tasks by priority for display
  const displayedTasks = useMemo(() => {
    return tasks.filter(
      (task) => priorityFilter === 'All' || task.priority === priorityFilter
    );
  }, [tasks, priorityFilter]);

  // Select all visible tasks
  const handleSelectAllVisible = useCallback(() => {
    const visibleIds = displayedTasks.map((t) => t.id);
    setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }, [displayedTasks]);

  // Clear all selection
  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds([]);
  }, []);

  // Reset all search and filter criteria to defaults
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter('All');
    setPriorityFilter('All');
  }, []);

  // Handle stock change with instant numerical sanitization and server synchronization
  const handleStockChange = useCallback((taskId, value) => {
    const parsedStock = Math.max(0, parseInt(value, 10) || 0);

    const currentTask = tasksRef.current.find((t) => t.id === taskId);
    if (currentTask && Number(currentTask.stockUnits) === parsedStock) {
      return;
    }

    pushHistory();

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, stockUnits: parsedStock } : task
      )
    );

    updateTask(taskId, { stockUnits: parsedStock })
      .then((updatedTask) => {
        setTasks((currentTasks) =>
          currentTasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
        setSaveError('');
      })
      .catch((error) => {
        setSaveError(error.message || 'Stock update failed on server');
      });
  }, [pushHistory]);

  // Handle notes change with server synchronization
  const handleNoteChange = useCallback((taskId, notes) => {
    const trimmedNotes = String(notes ?? '');
    const currentTask = tasksRef.current.find((t) => t.id === taskId);
    if (currentTask && String(currentTask.notes ?? '') === trimmedNotes) {
      return;
    }

    pushHistory();

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, notes: trimmedNotes } : task
      )
    );

    updateTask(taskId, { notes: trimmedNotes })
      .then((updatedTask) => {
        setTasks((currentTasks) =>
          currentTasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
        setSaveError('');
      })
      .catch((error) => {
        setSaveError(error.message || 'Note update failed on server');
      });
  }, [pushHistory]);

  // Bulk complete all selected tasks
  const handleBulkComplete = useCallback(async () => {
    const ids = [...selectedTaskIds];
    if (ids.length === 0) return;

    pushHistory();
    setIsProcessingBulk(true);
    const selectedSet = new Set(ids);

    // Optimistic UI update
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        selectedSet.has(task.id) ? { ...task, status: 'Completed' } : task
      )
    );

    try {
      await Promise.all(ids.map((id) => updateTask(id, { status: 'Completed' })));
      setSaveError('');
    } catch (error) {
      setSaveError(error.message || 'Bulk complete update failed');
    } finally {
      setIsProcessingBulk(false);
    }
  }, [selectedTaskIds, pushHistory]);

  // Bulk restock (+10) all selected tasks across the entire dataset
  const handleBulkRestock = useCallback(async () => {
    const ids = [...selectedTaskIds];
    if (ids.length === 0) return;

    pushHistory();
    setIsProcessingBulk(true);
    const selectedSet = new Set(ids);

    // Optimistic UI update for currently visible tasks
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        selectedSet.has(task.id)
          ? { ...task, stockUnits: (Number(task.stockUnits) || 0) + 10 }
          : task
      )
    );

    try {
      await Promise.all(
        ids.map(async (id) => {
          const taskInView = tasksRef.current.find((t) => t.id === id);
          const currentUnits = taskInView ? Number(taskInView.stockUnits) : 0;
          return updateTask(id, { stockUnits: currentUnits + 10 });
        })
      );
      setSaveError('');
    } catch (error) {
      setSaveError(error.message || 'Bulk restock failed');
    } finally {
      setIsProcessingBulk(false);
    }
  }, [selectedTaskIds, pushHistory]);

  // Calculate statistics (memoized with strict numerical safety)
  const totalUnits = useMemo(() => {
    return displayedTasks.reduce((sum, task) => {
      const units = parseInt(task.stockUnits, 10);
      const safeUnits = !isNaN(units) && units > 0 ? units : 0;
      return sum + safeUnits;
    }, 0);
  }, [displayedTasks]);

  const lowStockCount = useMemo(() => {
    return displayedTasks.filter(
      (task) => (Number(task.stockUnits) || 0) < LOW_STOCK_LIMIT
    ).length;
  }, [displayedTasks]);

  const completedCount = useMemo(() => {
    return displayedTasks.filter((task) => task.status === 'Completed').length;
  }, [displayedTasks]);

  const visibleSelectedCount = useMemo(() => {
    return displayedTasks.filter((task) => selectedTaskIds.includes(task.id)).length;
  }, [displayedTasks, selectedTaskIds]);

  return (
    <div className="app">
      <Header
        historyCount={history.length}
        onUndo={handleUndo}
        onSortByPriority={handleSortByPriority}
        sortDirection={sortDirection}
        onReverse={handleReverse}
      />

      <section className="grid-3">
        <AutoSaveCard
          saveCount={saveCount}
          saveError={saveError}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onTriggerSave={handleSave}
        />

        <PayloadPreviewCard lastSavedPayload={lastSavedPayload} />
      </section>

      <StatsOverview
        visibleCount={displayedTasks.length}
        totalUnits={totalUnits}
        lowStockCount={lowStockCount}
        completedCount={completedCount}
      />

      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        isSearching={isSearching}
        onResetFilters={handleResetFilters}
      />

      <BulkActionBar
        selectedCount={selectedTaskIds.length}
        visibleSelectedCount={visibleSelectedCount}
        visibleCount={displayedTasks.length}
        onClearSelection={handleClearSelection}
        onSelectAllVisible={handleSelectAllVisible}
        onBulkRestock={handleBulkRestock}
        onBulkComplete={handleBulkComplete}
        isProcessing={isProcessingBulk}
      />

      <TaskTable
        tasks={displayedTasks}
        selectedTaskIds={selectedTaskIds}
        onToggleSelect={handleToggleSelect}
        onSelectAllVisible={handleSelectAllVisible}
        onClearSelection={handleClearSelection}
        onStockChange={handleStockChange}
        onNoteChange={handleNoteChange}
        isSearching={isSearching}
        hasActiveFilters={searchQuery.trim() !== '' || categoryFilter !== 'All' || priorityFilter !== 'All'}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
