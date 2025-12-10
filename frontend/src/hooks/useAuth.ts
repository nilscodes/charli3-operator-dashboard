import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    setIsChecking(true);
    const hasKey = apiClient.hasApiKey();
    setIsAuthenticated(hasKey);
    setIsChecking(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    apiClient.clearApiKey();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isChecking,
    handleAuthSuccess,
    logout,
  };
}

