import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'chakra-ui-color-mode';

export function useColorMode() {
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    root.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleColorMode = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setColorMode = useCallback((newMode) => {
    setModeState(newMode);
  }, []);

  return { mode, toggleColorMode, setColorMode };
}
