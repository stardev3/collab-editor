/**
 * Notification.js
 * A self-displaying toast notification for user join/leave events.
 */

import React from 'react';

const ICONS = {
  join: '👋',
  leave: '👋',
  success: '✓',
  info: 'ℹ',
  error: '✕',
};

export default function Notification({ message, type = 'info' }) {
  return (
    <div className={`notification notification-${type}`}>
      <span className="notif-icon">{ICONS[type] || 'ℹ'}</span>
      {message}
    </div>
  );
}
