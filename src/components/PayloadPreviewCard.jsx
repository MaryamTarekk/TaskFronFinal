import React from 'react';

export default function PayloadPreviewCard({ lastSavedPayload }) {
  return (
    <div className="card span-2 payload-card">
      <div className="card-header-row">
        <span className="label">Last Saved Payload</span>
        {lastSavedPayload?.savedAt && (
          <span className="muted small mono">Timestamp: {lastSavedPayload.savedAt}</span>
        )}
      </div>

      <pre className="payload mono">
        {lastSavedPayload
          ? JSON.stringify(lastSavedPayload, null, 2)
          : 'Awaiting first auto-save...'}
      </pre>
    </div>
  );
}
