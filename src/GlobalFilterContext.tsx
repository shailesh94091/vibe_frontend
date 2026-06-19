import React, { createContext, useContext, useState } from 'react';

export type SortOption = 'default' | 'compatibility' | 'alphabetical';

interface GlobalFilterContextType {
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  return (
    <GlobalFilterContext.Provider value={{ selectedTag, setSelectedTag, sortBy, setSortBy }}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => {
  const context = useContext(GlobalFilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilter must be used within a GlobalFilterProvider');
  }
  return context;
};
