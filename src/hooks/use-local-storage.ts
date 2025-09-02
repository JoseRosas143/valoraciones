
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

function getKey(key: string, userId: string | null): string {
    return userId ? `${key}_${userId}` : key;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const compositeKey = getKey(key, userId);
      const item = window.localStorage.getItem(compositeKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined' && userId) {
        const compositeKey = getKey(key, userId);
        window.localStorage.setItem(compositeKey, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
        const compositeKey = getKey(key, userId);
        const item = window.localStorage.getItem(compositeKey);
        if (item) {
            try {
                setStoredValue(JSON.parse(item));
            } catch(e) {
                console.error("Error parsing JSON from localStorage", e);
                setStoredValue(initialValue);
            }
        } else {
            setStoredValue(initialValue);
        }
    } else if (!userId) {
        // Clear data if user logs out
        setStoredValue(initialValue);
    }
  }, [key, userId]);

  return [storedValue, setValue];
}
