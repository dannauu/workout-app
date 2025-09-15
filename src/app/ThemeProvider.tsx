'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff6b35', // Orange primary
      light: '#ff8a65',
      dark: '#e64a19',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800', // Orange secondary
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    divider: '#333333',
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #333333',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#2a2a2a',
        },
      },
    },
  },
});

interface CustomThemeProviderProps {
  children: ReactNode;
}

export default function CustomThemeProvider({ children }: CustomThemeProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
