import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { RosProvider } from './contexts/RosContext.js';


createRoot(document.getElementById('root')!).render(
  <RosProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </RosProvider>
)