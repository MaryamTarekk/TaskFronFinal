import { useEffect, useRef } from 'react';
import { CATEGORIES, PRIORITIES } from '../constants/taskConstants.js';

/**
 * Custom hook to synchronize dashboard filters, search, and selection with the browser URL.
 * - Parses URL query params on initial mount to restore state
 * - Updates URL query params in real-time as state changes (using replaceState to avoid cluttering history)
 * - Supports browser Back/Forward (popstate)
 */
export function useUrlSync({
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
}) {
  const isInitialized = useRef(false);

  // 1. On Mount: Read initial state from URL query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      const urlQ = params.get('q') || params.get('search');
      if (urlQ) {
        setSearchQuery(urlQ);
      }

      const urlCategory = params.get('category');
      if (urlCategory && CATEGORIES.includes(urlCategory)) {
        setCategoryFilter(urlCategory);
      }

      const urlPriority = params.get('priority');
      if (urlPriority && PRIORITIES.includes(urlPriority)) {
        setPriorityFilter(urlPriority);
      }

      const urlSort = params.get('sort');
      if (urlSort === 'asc' || urlSort === 'desc') {
        setSortDirection(urlSort);
      }

      const urlSelected = params.get('selected');
      if (urlSelected) {
        const ids = urlSelected
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        if (ids.length > 0) {
          setSelectedTaskIds(ids);
        }
      }
    } catch (e) {
      console.warn('Failed to parse URL query params', e);
    } finally {
      isInitialized.current = true;
    }
  }, [
    setSearchQuery,
    setCategoryFilter,
    setPriorityFilter,
    setSortDirection,
    setSelectedTaskIds,
  ]);

  // 2. On State Change: Reflect changes in URL search params
  useEffect(() => {
    if (!isInitialized.current) return;

    try {
      const params = new URLSearchParams();

      if (searchQuery && searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }

      if (categoryFilter && categoryFilter !== 'All') {
        params.set('category', categoryFilter);
      }

      if (priorityFilter && priorityFilter !== 'All') {
        params.set('priority', priorityFilter);
      }

      if (sortDirection && sortDirection !== 'desc') {
        params.set('sort', sortDirection);
      }

      if (selectedTaskIds && selectedTaskIds.length > 0) {
        params.set('selected', selectedTaskIds.join(','));
      }

      const queryString = params.toString();
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      // Update URL without triggering a full page reload or polluting back-button history
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      console.warn('Failed to update URL search params', e);
    }
  }, [
    searchQuery,
    categoryFilter,
    priorityFilter,
    sortDirection,
    selectedTaskIds,
  ]);

  // 3. Handle browser Back/Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('q') || params.get('search') || '');
      setCategoryFilter(params.get('category') || 'All');
      setPriorityFilter(params.get('priority') || 'All');
      setSortDirection(params.get('sort') || 'desc');

      const urlSelected = params.get('selected');
      if (urlSelected) {
        setSelectedTaskIds(
          urlSelected
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        );
      } else {
        setSelectedTaskIds([]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    setSearchQuery,
    setCategoryFilter,
    setPriorityFilter,
    setSortDirection,
    setSelectedTaskIds,
  ]);
}
