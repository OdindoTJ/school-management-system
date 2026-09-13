import React, { createContext, useContext, useState, useEffect } from 'react';

const ChildContext = createContext(null);

const STORAGE_KEY = 'parent_selected_child';

export const ChildProvider = ({ children }) => {
  const [selectedChild, setSelectedChildState] = useState(null);
  const [children_, setChildren_] = useState([]);

  // Restore from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSelectedChildState(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setSelectedChild = (child) => {
    if (child) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(child));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedChildState(child);
  };

  const clearSelectedChild = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedChildState(null);
  };

  return (
    <ChildContext.Provider
      value={{
        selectedChild,
        children: children_,
        setSelectedChild,
        setChildren: setChildren_,
        clearSelectedChild,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
};

export const useChild = () => {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used within a ChildProvider');
  return ctx;
};