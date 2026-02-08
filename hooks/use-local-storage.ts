import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

export default function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const isMounted = useRef(false);
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue((prev) => {
          // Only update if value is different (string comparison as simple check)
          if (JSON.stringify(prev) !== item) {
            return parsed;
          }
          return prev;
        });
      }
    } catch {
      window.localStorage.removeItem(key);
      setValue(defaultValue);
    }
    return () => {
      isMounted.current = false;
    };
  }, [defaultValue, key]);

  useEffect(() => {
    if (isMounted.current) {
      window.localStorage.setItem(key, JSON.stringify(value));
    } else {
      isMounted.current = true;
    }
  }, [key, value]);

  return [value, setValue];
}
