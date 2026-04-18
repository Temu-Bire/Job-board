import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Delays the update of a value by a specified amount of time.
 * Perfect for preventing rapid successive API calls on search inputs.
 *
 * @param {any} value - The state variable to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} - The debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Return a cleanup function that clears the timeout if value changes (or unmounts).
    // This is how we prevent debouncedValue from updating if value is changed
    // within the delay period.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
