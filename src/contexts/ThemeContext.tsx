import React, { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { ThemeProvider as EmotionThemeProvider, Global, css } from '@emotion/react';
import { lightTheme, darkTheme, type AppTheme } from '../theme/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const globalStyles = (theme: AppTheme) => css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    min-height: 100vh;
  }

  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: ${theme.colors.background.default};
    color: ${theme.colors.text.primary};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color ${theme.transitions.default}, color ${theme.transitions.default};
  }

  a {
    color: ${theme.colors.primary.main};
    text-decoration: none;
    &:hover {
      color: ${theme.colors.primary.light};
    }
  }
`;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const theme = useMemo(() => {
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setTheme }}>
      <EmotionThemeProvider theme={theme}>
        <Global styles={globalStyles(theme)} />
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
}


