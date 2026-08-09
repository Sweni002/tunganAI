import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SnackbarProvider, useSnackbar } from 'notistack';
// main.jsx

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <SnackbarProvider maxSnack={3}>
      <App />
    </SnackbarProvider>
  </StrictMode>,
)
