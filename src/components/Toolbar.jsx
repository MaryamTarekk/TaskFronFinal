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
}) {
  return (
    <section className="card toolbar">
      <div className="search">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
            title="Clear search"
            type="button"
          >
            ×
          </button>
        )}

        {isSearching && (
          <span className="querying">
            <span className="spinner-dot"></span> Querying...
          </span>
        )}
      </div>

      <div className="filters">
        <label htmlFor="filter-category">
          <span>Category</span>
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="filter-priority">
          <span>Priority</span>
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
    </section>
  );
}
