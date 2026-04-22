/**
 * UserAvatar.js
 * Circular avatar showing the user's initials with their assigned color.
 */

import React from 'react';

export default function UserAvatar({ name, color }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      className="user-avatar"
      title={name}
      style={{ backgroundColor: color, borderColor: color + '44' }}
    >
      {initials}
    </div>
  );
}
