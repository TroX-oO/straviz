import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
