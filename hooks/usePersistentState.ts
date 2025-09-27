
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom React hook that provides a state variable that persists in localStorage.
 * @param key The key to use in localStorage.
 * @param initialState The initial state value if nothing is in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function usePersistentState<T>(key: string, initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      // If a value is stored, parse it. Otherwise, use the initial state.
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      // If parsing fails, log the error and proceed with the initial state.
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      // Whenever the state changes, save it to localStorage.
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // If saving fails, log the error.
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistentState;