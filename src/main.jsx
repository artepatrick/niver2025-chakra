import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from './theme'
import { getHostId } from './utils'

// Ensure a default host_id is set and persisted for this app instance
try {
  const resolvedHostId = getHostId();
  if (typeof window !== 'undefined') {
    localStorage.setItem('host_id', resolvedHostId);
  }
} catch {
  // noop: fallback is handled inside getHostId
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
