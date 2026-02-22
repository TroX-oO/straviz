import '@emotion/react';
import { AppTheme } from './theme/theme';

declare module '@emotion/react' {
  export interface Theme extends AppTheme {}
}
