import React, { useState, useEffect, useRef } from 'react';
import { AUTO_SAVE_INTERVAL_SECONDS } from '../constants/taskConstants.js';

export default function AutoSaveCard({
  saveCount,
  saveError,
  isSaving,
  lastSavedAt,
  onTriggerSave,
}) {
  const [countdown, setCountdown] = useState(AUTO_SAVE_INTERVAL_SECONDS);
  const onTriggerSaveRef = useRef(onTriggerSave);
  onTriggerSaveRef.current = onTriggerSave;

  // Dedicated 1-second tick that stays isolated inside this component,
  // preventing unnecessary full-page and table re-renders!
  useEffect(() => {
    let ticks = AUTO_SAVE_INTERVAL_SECONDS;

    const timer = setInterval(() => {
      ticks -= 1;

      if (ticks <= 0) {
        ticks = AUTO_SAVE_INTERVAL_SECONDS;
        setCountdown(AUTO_SAVE_INTERVAL_SECONDS);
        onTriggerSaveRef.current?.();
      } else {
        setCountdown(ticks);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card autosave-card">
      <div className="card-header-row">
        <span className="label">Auto-save Status</span>
        {isSaving ? (
          <span className="badge badge-warning">Saving...</span>
        ) : lastSavedAt ? (
          <span className="badge badge-success">Synced</span>
        ) : (
          <span className="badge badge-neutral">Standby</span>
        )}
      </div>

      <p className="big mono accent countdown-display">
        Next auto-save in: <span className="highlight-number">{countdown}s</span>
      </p>

      <div className="autosave-meta">
        <span className="muted small">Saves completed: <strong>{saveCount}</strong></span>
        {lastSavedAt && (
          <span className="muted small">Last saved: <strong>{lastSavedAt}</strong></span>
        )}
      </div>

      {saveError && (
        <div role="alert" className="alert-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{saveError}</span>
        </div>
      )}

      <div className="card-footer-action">
        <button
          id="btn-manual-save"
          className="btn sm ghost"
          onClick={() => onTriggerSave()}
          disabled={isSaving}
          title="Trigger an immediate save without waiting for the timer"
        >
          {isSaving ? 'Saving...' : 'Save Now'}
        </button>
      </div>
    </div>
  );
}
