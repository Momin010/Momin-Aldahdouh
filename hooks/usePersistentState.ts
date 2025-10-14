import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom React hook that provides a state variable that persists in localStorage.
 * Can be made user-specific by providing a userKey.
 * @param key The base key to use in localStorage.
 * @param initialState The initial state value if nothing is in localStorage.
 * @param userKey An optional key to make the storage user-specific.
 * @returns A stateful value, and a function to update it.
 */
function usePersistentState<T>(key: string, initialState: T, userKey?: string): [T, Dispatch<SetStateAction<T>>] {
  const persistentKey = userKey ? `${key}_${userKey}` : key;

  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(persistentKey);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${persistentKey}”:`, error);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(persistentKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${persistentKey}”:`, error);
    }
  }, [persistentKey, state]);

  return [state, setState];
}

export default usePersistentState;
