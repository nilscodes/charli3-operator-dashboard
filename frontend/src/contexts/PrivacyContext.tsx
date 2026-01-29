import { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  // Always start with privacy mode ON, no localStorage persistence
  const [privacyMode, setPrivacyMode] = useState(true);

  const togglePrivacy = () => {
    setPrivacyMode((prev) => !prev);
  };

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

