import React, { createContext, useState, useContext, useEffect } from 'react';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  // Pure frontend state, persisted in localStorage for seamless tab & session persistence
  const [isEventClosed, setIsEventClosedState] = useState(() => {
    try {
      const saved = localStorage.getItem('acm_21day_event_closed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const setIsEventClosed = (closedOrFn) => {
    setIsEventClosedState((prev) => {
      const nextVal = typeof closedOrFn === 'function' ? closedOrFn(prev) : closedOrFn;
      try {
        localStorage.setItem('acm_21day_event_closed', String(nextVal));
      } catch (err) {
        console.warn('Could not persist kill switch state:', err);
      }
      return nextVal;
    });
  };

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'acm_21day_event_closed') {
        setIsEventClosedState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <EventContext.Provider value={{ isEventClosed, setIsEventClosed }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
