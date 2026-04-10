// Custom hook for debounced values
import { useState, useEffect } from 'react';
import { SEARCH_CONFIG } from '../constants/config';

export function useDebounce<T>(value: T, delay: number = SEARCH_CONFIG.debounceDelay): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;
