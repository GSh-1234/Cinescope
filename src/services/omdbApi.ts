import { MovieDetails, SearchResponse, MovieFilterType } from '../types/movie';

const BASE_URL = 'https://www.omdbapi.com/';
const DEFAULT_API_KEY = 'b9a5e69d';
const STORAGE_KEY = 'cine_scope_omdb_api_key';

/**
 * Retrieves the currently active OMDb API key.
 * Prioritizes user override in localStorage, then .env, then reliable fallback.
 */
export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem(STORAGE_KEY);
    if (userKey && userKey.trim().length > 0) {
      return userKey.trim();
    }
  }
  return import.meta.env.VITE_OMDB_API_KEY || DEFAULT_API_KEY;
}

/**
 * Allows the user to configure their own custom API key at runtime.
 */
export function setApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

/**
 * Resets back to the default bundled API key.
 */
export function resetApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Performs a GET request and returns the parsed JSON body.
 *
 * Responsibilities:
 *  - Passes the AbortSignal through to fetch so callers can cancel.
 *  - Re-throws AbortError untouched, because callers must be able to tell
 *    "I cancelled this on purpose" apart from "something went wrong".
 *  - Turns every other failure into an Error with a message that is safe to
 *    show to a user (raw browser text like "Failed to fetch" is not).
 *
 * Note: fetch() only rejects on network failure. An HTTP 404/500 still
 * resolves, so `response.ok` has to be checked by hand.
 */
async function fetchJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url.toString(), { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // fetch rejects with a TypeError when the network is down, DNS fails, etc.
    throw new Error(
      "Couldn't reach the movie service. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    throw new Error(
      `The movie service returned an error (${response.status}). Please try again in a moment.`
    );
  }

  try {
    return (await response.json()) as T;
  } catch (err: unknown) {
    // The body can also be aborted while it is still being read.
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new Error('The movie service sent an unreadable response. Please try again.');
  }
}

export interface SearchMoviesParams {
  query: string;
  page?: number;
  type?: MovieFilterType;
  signal?: AbortSignal;
}

/**
 * Searches movies by title with pagination, optional type filter, and AbortSignal support.
 */
export async function searchMovies({
  query,
  page = 1,
  type = 'all',
  signal,
}: SearchMoviesParams): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { Response: 'True', Search: [], totalResults: '0' };
  }

  const apiKey = getApiKey();
  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('s', trimmed);
  url.searchParams.set('page', page.toString());

  if (type && type !== 'all') {
    url.searchParams.set('type', type);
  }

  // OMDb answers HTTP 200 even for "not found" / "bad key", with
  // { Response: "False", Error: "..." } in the body. The caller inspects that.
  return fetchJson<SearchResponse>(url, signal);
}

export interface GetMovieDetailsParams {
  imdbID: string;
  signal?: AbortSignal;
}

/**
 * Fetches full details for a movie by IMDb ID with AbortSignal support.
 */
export async function getMovieDetails({
  imdbID,
  signal,
}: GetMovieDetailsParams): Promise<MovieDetails> {
  if (!imdbID) {
    throw new Error('imdbID is required to fetch movie details.');
  }

  const apiKey = getApiKey();
  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('i', imdbID);
  url.searchParams.set('plot', 'full');

  const data = await fetchJson<MovieDetails>(url, signal);

  if (data.Response === 'False') {
    throw new Error(data.Error || 'Failed to fetch movie details.');
  }

  return data;
}

