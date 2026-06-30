import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChakraProvider, Theme } from '@chakra-ui/react';
import { system } from '../theme';

const STORAGE_KEY = 'chakra-ui-color-mode';
const ColorModeContext = createContext(null);

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ChakraProvider value={system}>
        <Theme appearance={mode} hasBackground>
          {children}
        </Theme>
      </ChakraProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}
