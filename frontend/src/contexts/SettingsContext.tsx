import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type VocabDirection = 'de-en' | 'en-de';

interface SettingsContextType {
  vocabDirection: VocabDirection;
  setVocabDirection: (dir: VocabDirection) => void;
}

const STORAGE_KEY = 'vocabmaster_vocab_direction';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [vocabDirection, setVocabDirectionState] = useState<VocabDirection>('de-en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as VocabDirection | null;
    if (stored === 'de-en' || stored === 'en-de') {
      setVocabDirectionState(stored);
    }
  }, []);

  const setVocabDirection = (dir: VocabDirection) => {
    setVocabDirectionState(dir);
    localStorage.setItem(STORAGE_KEY, dir);
  };

  return (
    <SettingsContext.Provider value={{ vocabDirection, setVocabDirection }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
