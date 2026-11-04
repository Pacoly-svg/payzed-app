import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupKeyboardHandling } from './utils/keyboard'
import { leaveApp, setupBackNavigation } from './utils/backStack'

setupKeyboardHandling()
// Si plus rien ne peut être fermé (cas extrême), on passe l'app en arrière-plan.
void setupBackNavigation(() => void leaveApp())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
