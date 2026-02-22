export const lightTheme = {
  colors: {
    primary: {
      main: '#fc4c02', // Strava orange
      light: '#ff7c43',
      dark: '#c43e00',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1a1a2e',
      light: '#2d2d44',
      dark: '#0f0f1a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#171717',
      secondary: '#666666',
    },
    error: '#d32f2f',
    success: '#2e7d32',
    warning: '#ed6c02',
  },
  spacing: (factor: number) => `${factor * 8}px`,
  borderRadius: '8px',
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.12)',
    large: '0 8px 16px rgba(0, 0, 0, 0.14)',
  },
  transitions: {
    default: '0.3s ease',
  },
};

export const darkTheme = {
  colors: {
    primary: {
      main: '#fc4c02', // Strava orange
      light: '#ff7c43',
      dark: '#c43e00',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
      contrastText: '#000000',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#ededed',
      secondary: '#a0a0a0',
    },
    error: '#f44336',
    success: '#4caf50',
    warning: '#ff9800',
  },
  spacing: (factor: number) => `${factor * 8}px`,
  borderRadius: '8px',
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.4)',
    large: '0 8px 16px rgba(0, 0, 0, 0.5)',
  },
  transitions: {
    default: '0.3s ease',
  },
};

export type AppTheme = typeof lightTheme;
