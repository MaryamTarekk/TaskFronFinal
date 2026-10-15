import React from 'react';
import { CATEGORIES, PRIORITIES } from '../constants/taskConstants.js';

export default function Toolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  priorityFilter,
  onPriorityChange,
  isSearching,
  onResetFilters,
}) {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'All' ||
    priorityFilter !== 'All';

  return (
    <section className="card toolbar">
      <div className="toolbar-top">
        {/* Search Box with stable inner icons (no jumping/flickering) */}
        <div className="search-box">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or task code (e.g. TSK-102)..."
            aria-label="Search tasks"
          />

          <div className="search-box-end">
            {isSearching && (
              <span className="search-spinner" title="Querying tasks...">
                <span className="spinner-mini"></span>
              </span>
            )}

            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => onSearchChange('')}
                title="Clear search"
                type="button"
                aria-label="Clear search query"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="priority-select-wrap">
          <label htmlFor="filter-priority" className="filter-label">
            <span>Priority:</span>
            <select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
            >
              {PRIORITIES.map((prio) => (
                <option key={prio} value={prio}>
                  {prio}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Category Pills & Active Filter Bar */}
      <div className="toolbar-bottom">
        <div
          className="category-pills"
          role="radiogroup"
          aria-label="Category filter"
        >
          <span className="filter-group-title">Category:</span>
          {CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`category-pill ${isActive ? 'active' : ''} cat-${cat.toLowerCase()}`}
                onClick={() => onCategoryChange(cat)}
                aria-pressed={isActive}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <div className="active-filters-info">
            <span className="muted small">Filtered</span>
            <button
              type="button"
              className="btn-reset-filters"
              onClick={onResetFilters}
              title="Reset search and all filters to default"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
