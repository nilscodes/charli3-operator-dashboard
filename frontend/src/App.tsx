import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { NodeDetail } from '@/pages/NodeDetail';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { isAuthenticated, isChecking, handleAuthSuccess } = useAuth();

  if (isChecking) {
    return null;
  }

  return (
    <ChakraProvider>
      <ApiKeyModal isOpen={!isAuthenticated} onSuccess={handleAuthSuccess} />
      {isAuthenticated && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/node/:address" element={<NodeDetail />} />
          </Routes>
        </BrowserRouter>
      )}
    </ChakraProvider>
  );
}

export default App;

