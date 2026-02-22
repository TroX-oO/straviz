
import { css } from '@emotion/react';
import { Theme } from './theme';

export const createGlobalStyles = (theme: Theme) => css`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
  }
  
  ul {
    list-style: none;
  }
`;
