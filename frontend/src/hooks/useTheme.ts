import { useColorMode } from '@chakra-ui/react';
import { useEffect } from 'react';

export function useTheme() {
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    const savedMode = localStorage.getItem('chakra-ui-color-mode');
    
    if (!savedMode) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemMode = prefersDark ? 'dark' : 'light';
      setColorMode(systemMode);
    }
  }, [setColorMode]);

  return {
    colorMode,
    toggleColorMode,
    isDark: colorMode === 'dark',
  };
}
