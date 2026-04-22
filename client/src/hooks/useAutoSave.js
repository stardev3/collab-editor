/**
 * useAutoSave.js
 * Debounced auto-save hook. Triggers a save 2 seconds after the user stops typing.
 */

import { useEffect, useRef } from 'react';

export function useAutoSave({ content, title, language, onSave, delay = 2000 }) {
  const timerRef = useRef(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Don't trigger auto-save on initial mount
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Set new timer
    timerRef.current = setTimeout(() => {
      onSave({ content, title, language });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, title, language, onSave, delay]);
}
