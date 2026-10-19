import { useState, useEffect, useRef, useCallback } from 'react';
import { Movie, MovieFilterType } from '../types/movie';
import { searchMovies } from '../services/omdbApi';

const DEBOUNCE_MS = 300;

interface UseMovieSearchResult {
  query: string;
  setQuery: (q: string) => void;
  filterType: MovieFilterType;
  setFilterType: (type: MovieFilterType) => void;
  movies: Movie[];
  totalResults: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retryLoadMore: () => void;
  refresh: () => void;
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'AbortError'
  );
}

/**
 * Search state for the Discover tab.
 *
 * Two kinds of request exist:
 *  - a "search"      -> page 1, replaces the results (runSearch)
 *  - a "load more"   -> page N+1, appends to the results (loadMore)
 *
 * At most ONE request is ever in flight. `controllerRef` holds its
 * AbortController, so "is something in flight?" is simply
 * `controllerRef.current !== null`.
 */
export function useMovieSearch(initialQuery: string = 'Batman'): UseMovieSearchResult {
  const [query, setQueryState] = useState<string>(initialQuery);
  const [filterType, setFilterType] = useState<MovieFilterType>('all');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  // Start in "loading" when there is an initial query, so the first paint shows
  // skeletons instead of flashing the empty state before the effect runs.
  const [isLoading, setIsLoading] = useState<boolean>(initialQuery.trim() !== '');
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Error from an infinite-scroll page request. Kept separate from `error`
  // so a failed page 2 never wipes out the results the user is looking at.
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  // True once OMDb says there are no further pages.
  const [reachedEnd, setReachedEnd] = useState<boolean>(false);

  // Refs hold values that async code must read *now*, not as they were when
  // a closure was created, and that must not trigger a re-render.
  const controllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef<number>(1);
  // The query + filter that produced the results currently on screen.
  // loadMore() uses THIS, not the live text in the input box, so it can never
  // append page N of a different query onto the visible list.
  const committedRef = useRef<{ query: string; type: MovieFilterType }>({
    query: '',
    type: 'all',
  });
  // Latest values of the live input / filter, for callbacks that outlive a render.
  const queryRef = useRef(query);
  queryRef.current = query;
  const filterTypeRef = useRef(filterType);
  filterTypeRef.current = filterType;

  /** Cancels the in-flight request (if any). */
  const abortActiveRequest = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setIsLoadingMore(false);
  }, []);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * Page 1 search. Replaces the results.
   */
  const runSearch = useCallback(
    async (searchQuery: string, type: MovieFilterType) => {
      clearDebounceTimer();
      abortActiveRequest();

      const trimmed = searchQuery.trim();

      if (!trimmed) {
        committedRef.current = { query: '', type };
        pageRef.current = 1;
        setMovies([]);
        setTotalResults(0);
        setError(null);
        setLoadMoreError(null);
        setReachedEnd(false);
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      setLoadMoreError(null);

      try {
        const response = await searchMovies({
          query: trimmed,
          page: 1,
          type,
          signal: controller.signal,
        });

        // A newer request has taken over; this response is stale. Drop it.
        if (controller.signal.aborted) return;

        if (response.Response === 'True' && response.Search) {
          committedRef.current = { query: trimmed, type };
          pageRef.current = 1;
          setMovies(response.Search);
          setTotalResults(parseInt(response.totalResults || '0', 10));
          setReachedEnd(false);
        } else {
          // OMDb answered, but with Response: "False" (e.g. "Movie not found!")
          setMovies([]);
          setTotalResults(0);
          setError(response.Error || 'No movies found matching your search.');
        }
      } catch (err: unknown) {
        if (isAbortError(err)) return; // intentional cancellation, not an error
        // Real failure: clear the old results so the error screen is shown
        // instead of results that belong to a different query.
        setMovies([]);
        setTotalResults(0);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        // If this request was cancelled, a newer one now owns the loading
        // flags. Touching them here is what used to make the skeleton vanish
        // while the replacement request was still running.
        if (!controller.signal.aborted) {
          if (controllerRef.current === controller) controllerRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [abortActiveRequest, clearDebounceTimer]
  );

  /**
   * Keystroke handler.
   * 1. Update the input immediately so typing feels instant.
   * 2. Cancel any in-flight request right now (spec: a new keystroke cancels it).
   * 3. Restart the 300ms debounce timer.
   */
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      abortActiveRequest();
      clearDebounceTimer();

      // Show "searching" feedback during the debounce wait. It also keeps
      // infinite scroll switched off while a new search is pending.
      if (newQuery.trim()) setIsLoading(true);

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        runSearch(newQuery, filterTypeRef.current);
      }, DEBOUNCE_MS);
    },
    [abortActiveRequest, clearDebounceTimer, runSearch]
  );

  // Runs on mount (initial search) and whenever the filter changes.
  // No debounce here: a click on a filter chip is a single deliberate action.
  useEffect(() => {
    runSearch(queryRef.current, filterType);
  }, [filterType, runSearch]);

  // On unmount: cancel the request and the pending timer.
  useEffect(() => {
    return () => {
      abortActiveRequest();
      clearDebounceTimer();
    };
  }, [abortActiveRequest, clearDebounceTimer]);

  const hasMore =
    movies.length > 0 && movies.length < totalResults && !reachedEnd && loadMoreError === null;

  /**
   * Infinite scroll: fetch the next page and append it.
   */
  const loadMore = useCallback(async () => {
    // Guards, in order: a request is in flight / a debounced search is
    // pending / nothing committed yet. Checked synchronously through refs so
    // two quick calls can never start two requests.
    if (controllerRef.current !== null || debounceTimerRef.current !== null) return;
    const { query: committedQuery, type } = committedRef.current;
    if (!committedQuery) return;

    const nextPage = pageRef.current + 1;
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await searchMovies({
        query: committedQuery,
        page: nextPage,
        type,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (response.Response === 'True' && response.Search && response.Search.length > 0) {
        pageRef.current = nextPage;
        setMovies((prev) => {
          // OMDb occasionally repeats an item across pages; keep imdbID unique.
          const existingIds = new Set(prev.map((m) => m.imdbID));
          const fresh = response.Search!.filter((m) => !existingIds.has(m.imdbID));
          return [...prev, ...fresh];
        });
      } else {
        // OMDb has nothing more to give (e.g. "Movie not found!" past the last
        // page). Stop asking, otherwise the sentinel would trigger forever.
        setReachedEnd(true);
      }
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      // Keep the results, remember the failure. hasMore becomes false, which
      // switches the IntersectionObserver off, so there is no retry loop.
      setLoadMoreError(err instanceof Error ? err.message : 'Could not load more results.');
    } finally {
      if (!controller.signal.aborted) {
        if (controllerRef.current === controller) controllerRef.current = null;
        setIsLoadingMore(false);
      }
    }
  }, []);

  /** User-triggered retry after a failed page request. */
  const retryLoadMore = useCallback(() => {
    setLoadMoreError(null);
    loadMore();
  }, [loadMore]);

  /** Re-run the current search (page 1) with the live input + filter. */
  const refresh = useCallback(() => {
    runSearch(queryRef.current, filterTypeRef.current);
  }, [runSearch]);

  return {
    query,
    setQuery,
    filterType,
    setFilterType,
    movies,
    totalResults,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    retryLoadMore,
    refresh,
  };
}
