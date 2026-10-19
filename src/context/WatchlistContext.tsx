import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Movie } from '../types/movie';
import { WatchlistItem, WatchlistStatus } from '../types/watchlist';

const STORAGE_KEY = 'cinescope_user_watchlist_v1';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  message: string;
}

interface WatchlistContextType {
  items: WatchlistItem[];
  isInWatchlist: (imdbID: string) => boolean;
  getWatchlistItem: (imdbID: string) => WatchlistItem | undefined;
  addToWatchlist: (movie: Movie, status?: WatchlistStatus) => void;
  removeFromWatchlist: (imdbID: string) => void;
  toggleStatus: (imdbID: string) => void;
  setStatus: (imdbID: string, status: WatchlistStatus) => void;
  clearWatchlist: () => void;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

function loadInitialWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse watchlist from localStorage:', err);
  }
  return [];
}

export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WatchlistItem[]>(loadInitialWatchlist);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Always-current copy of the watchlist. Handlers read this to decide what to
  // do (e.g. "is it a duplicate?") and to pick the toast text, so those
  // decisions never depend on a possibly stale render closure and no side
  // effect (toast) has to run inside a state-updater function. React expects
  // updater functions to be pure: in StrictMode it may call them twice.
  const itemsRef = useRef<WatchlistItem[]>(items);

  /**
   * Single place where the watchlist changes.
   * 1. compute the next list from the latest list,
   * 2. remember it in the ref right away,
   * 3. hand it to React -> the UI re-renders immediately (the optimistic part).
   * Writing to localStorage happens afterwards, in the effect below.
   */
  const commit = useCallback((updater: (prev: WatchlistItem[]) => WatchlistItem[]) => {
    const next = updater(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save watchlist to localStorage:', err);
    }
  }, [items]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            itemsRef.current = updated;
            setItems(updated);
          }
        } catch {
          // ignore corrupted data from outside
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isInWatchlist = useCallback(
    (imdbID: string): boolean => {
      return items.some((item) => item.movie.imdbID === imdbID);
    },
    [items]
  );

  const getWatchlistItem = useCallback(
    (imdbID: string): WatchlistItem | undefined => {
      return items.find((item) => item.movie.imdbID === imdbID);
    },
    [items]
  );

  /**
   * Add a movie. The UI updates immediately; persistence follows in an effect.
   * Duplicate prevention: a movie with the same imdbID is never added twice.
   */
  const addToWatchlist = useCallback(
    (movie: Movie, status: WatchlistStatus = 'PLAN_TO_WATCH') => {
      const alreadyThere = itemsRef.current.some((item) => item.movie.imdbID === movie.imdbID);
      if (alreadyThere) {
        showToast(`"${movie.Title}" is already in your watchlist.`, 'info');
        return;
      }

      const now = Date.now();
      const newItem: WatchlistItem = { movie, status, addedAt: now, updatedAt: now };
      commit((prev) => [newItem, ...prev]);

      showToast(
        status === 'WATCHED'
          ? `Added "${movie.Title}" to Watched list`
          : `Added "${movie.Title}" to Watchlist`,
        'success'
      );
    },
    [commit, showToast]
  );

  const removeFromWatchlist = useCallback(
    (imdbID: string) => {
      const target = itemsRef.current.find((item) => item.movie.imdbID === imdbID);
      if (!target) return;

      commit((prev) => prev.filter((item) => item.movie.imdbID !== imdbID));
      showToast(`Removed "${target.movie.Title}" from Watchlist`, 'info');
    },
    [commit, showToast]
  );

  /** Toggle status between PLAN_TO_WATCH and WATCHED. */
  const toggleStatus = useCallback(
    (imdbID: string) => {
      const target = itemsRef.current.find((item) => item.movie.imdbID === imdbID);
      if (!target) return;

      const nextStatus: WatchlistStatus =
        target.status === 'PLAN_TO_WATCH' ? 'WATCHED' : 'PLAN_TO_WATCH';

      commit((prev) =>
        prev.map((item) =>
          item.movie.imdbID === imdbID
            ? { ...item, status: nextStatus, updatedAt: Date.now() }
            : item
        )
      );

      showToast(
        nextStatus === 'WATCHED'
          ? `Marked "${target.movie.Title}" as Watched! 🎉`
          : `Moved "${target.movie.Title}" to Plan to Watch`,
        'success'
      );
    },
    [commit, showToast]
  );

  const setStatus = useCallback(
    (imdbID: string, status: WatchlistStatus) => {
      commit((prev) =>
        prev.map((item) =>
          item.movie.imdbID === imdbID ? { ...item, status, updatedAt: Date.now() } : item
        )
      );
    },
    [commit]
  );

  const clearWatchlist = useCallback(() => {
    commit(() => []);
    showToast('Watchlist cleared.', 'info');
  }, [commit, showToast]);

  return (
    <WatchlistContext.Provider
      value={{
        items,
        isInWatchlist,
        getWatchlistItem,
        addToWatchlist,
        removeFromWatchlist,
        toggleStatus,
        setStatus,
        clearWatchlist,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export function useWatchlist(): WatchlistContextType {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

