import React from 'react';
import { Global, css } from '@emotion/react';
import { Theme } from './theme';

interface GlobalStylesProps {
  theme: Theme;
}

export const GlobalStyles: React.FC<GlobalStylesProps> = ({ theme }) => (
  <Global
    styles={css`
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html {
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: ${theme.typography.fontFamily};
        font-size: ${theme.typography.fontSize.md};
        color: ${theme.colors.text};
        background-color: ${theme.colors.background};
        line-height: 1.5;
        min-height: 100vh;
      }

      #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      a {
        color: ${theme.colors.primary};
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      button {
        cursor: pointer;
        font-family: inherit;
      }

      input,
      select,
      textarea {
        font-family: inherit;
        font-size: inherit;
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: ${theme.colors.background};
      }

      ::-webkit-scrollbar-thumb {
        background: ${theme.colors.border};
        border-radius: 4px;

        &:hover {
          background: ${theme.colors.textMuted};
        }
      }
    `}
  />
);
