import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LeadDialog from '@/components/LeadDialog';

const LeadContext = createContext(null);

export function LeadProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState({});
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const openLead = useCallback((params = {}) => {
    setInitial(params);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openLead, closeLead: () => setOpen(false) }), [openLead]);

  return (
    <LeadContext.Provider value={value}>
      {children}
      <LeadDialog open={open} onOpenChange={setOpen} initial={initial} />
    </LeadContext.Provider>
  );
}

export function useLead() {
  return useContext(LeadContext) || { openLead: () => {} };
}

export default LeadProvider;