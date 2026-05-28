import { useState, useEffect, useCallback } from 'react';

/**
 * A robust hook for persisting state to localStorage with cross-tab synchronization.
 * @param {string} key - The identity key for the storage.
 * @param {any} initialValue - The fallback value if no state is found.
 * @returns {[any, Function]}
 */
export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Persistence recovery failed for key "${key}":`, e);
    }
    return initialValue;
  });

  const setPersistentState = useCallback((value) => {
    setState((prevState) => {
      const nextState = value instanceof Function ? value(prevState) : value;
      try {
        localStorage.setItem(key, JSON.stringify(nextState));
      } catch (e) {
        console.error(`Persistence save failed for key "${key}":`, e);
      }
      return nextState;
    });
  }, [key]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error(`Cross-tab sync error for key "${key}":`, err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [state, setPersistentState];
}

/**
 * HydrationGuard ensures critical system data is ready before rendering children.
 */
export function HydrationGuard({ children, criticalKeys = [], onHydrated }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSafeBoot, setIsSafeBoot] = useState(false);

  const performReset = () => {
    localStorage.clear();
    sessionStorage.removeItem('regisSys_boot_count');
    window.location.reload();
  };

  useEffect(() => {
    // ── Safe-Boot Detection Layer ──
    const bootCount = parseInt(sessionStorage.getItem('regisSys_boot_count') || '0');
    
    if (bootCount >= 3) {
      setIsSafeBoot(true);
      setIsHydrating(false);
      return;
    }

    sessionStorage.setItem('regisSys_boot_count', (bootCount + 1).toString());

    // If we stay alive for 5 seconds, consider the boot successful
    const timer = setTimeout(() => {
      sessionStorage.setItem('regisSys_boot_count', '0');
    }, 5000);

    setIsHydrating(false);
    if (onHydrated) onHydrated();

    return () => clearTimeout(timer);
  }, []);

  if (isSafeBoot) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-[9999] p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2 italic">Recovery Mode</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            The system detected a potential crash loop. This usually happens when cached data becomes corrupted. 
          </p>
          <button 
            onClick={performReset}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs tracking-widest uppercase hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-900/20"
          >
            Reset System State
          </button>
        </div>
      </div>
    );
  }

  if (isHydrating) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-blue-500 font-bold text-xs tracking-widest uppercase animate-pulse">
            Restoring System State...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
