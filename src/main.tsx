import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { RosProvider } from './contexts/RosContext.js';
import { applyTheme } from './theme.js';
import { loadTheme } from './services/useTheme.js';

// La paleta del tema guardado se aplica antes del primer render para que no haya un destello con los colores originales
const { theme, palette } = loadTheme();
applyTheme(theme, palette);

createRoot(document.getElementById('root')!).render(
  <RosProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </RosProvider>
)
