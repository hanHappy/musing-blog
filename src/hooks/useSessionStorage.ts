'use client';

import { useState } from 'react';

/**
 * Hook that syncs state with sessionStorage
 * Safe for SSR - initializes from sessionStorage on mount
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to sessionStorage:`, error);
    }
  };

  return [storedValue, setValue];
}
