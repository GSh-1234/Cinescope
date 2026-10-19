# CineScope — Movie Explorer & Watchlist

A movie search and watchlist app built with **React 18**, **TypeScript**, **Vite** and **Tailwind CSS**, using the [OMDb API](https://www.omdbapi.com/). Built for the Second-Year Web Development recruitment assessment.

- **Live demo:** _add your deployed link here_
- **Source:** _add your GitHub repo link here_

---

## Features

### Search
- **Live search as you type**, debounced by **300 ms**.
- **Request cancellation with `AbortController`:** a new keystroke cancels the request that is still in flight, so a slow, outdated response can never overwrite a newer one.
- Filter by **All / Movies / Series / Episodes**, plus one-click suggestion chips.

### Results
- Cards show **title, release year, poster** and a type badge.
- Poster fallback when the poster is `"N/A"` or fails to load.
- **Skeleton loaders** for the first load and while the next page loads.
- **Error handling** with readable messages and a Retry button:
  - OMDb answers such as "Movie not found!" or "Too many results." get a friendly explanation (no Retry button, because retrying the same query cannot help).
  - Network drops and server errors show a message and a **Retry** button.
  - A failed *next page* shows an inline "Retry loading more" under the results you already have; it never replaces them.

### Watchlist
- Add / remove from the cards or the detail modal.
- **Duplicate prevention:** a movie is identified by its `imdbID` and can only be in the list once.
- Toggle between **Plan to Watch** and **Watched**.
- **Persists in `localStorage`**, so it survives a refresh. Changes made in another tab are picked up through the `storage` event.
- Watchlist tab with filtering, title search and sorting.

### Bonus features
- **Detail modal** (plot, cast, director, ratings, box office, …) without leaving the page.
- **Infinite scroll** with an `IntersectionObserver` on a sentinel element under the grid (no pagination buttons).
- **Optimistic UI:** watchlist changes update the screen immediately; saving to `localStorage` happens afterwards (see below).
- **Responsive layout** for desktop and mobile.
- Optional in-app "API Config" modal to try your own OMDb key.

---

## Project structure

```
├── .env.example                  # shows the expected environment variable
├── index.html
├── package.json
├── tailwind.config.js / postcss.config.js / tsconfig.json / vite.config.ts
└── src/
    ├── main.tsx                  # mounts <App/> inside <WatchlistProvider/>
    ├── App.tsx                   # wires the hooks to the components
    ├── types/
    │   ├── movie.ts              # Movie, MovieDetails, SearchResponse
    │   └── watchlist.ts          # WatchlistItem, WatchlistStatus
    ├── services/
    │   └── omdbApi.ts            # ALL network code lives here (no fetch in components)
    ├── context/
    │   └── WatchlistContext.tsx  # watchlist state, localStorage, toasts
    ├── hooks/
    │   ├── useMovieSearch.ts     # search state: debounce, abort, pagination
    │   ├── useMovieDetails.ts    # detail-modal fetch with its own AbortController
    │   ├── useIntersectionObserver.ts
    │   └── useWatchlist.ts       # re-export of the context hook
    └── components/               # presentation only: Navbar, SearchBar, MovieGrid,
                                  # MovieCard, MovieDetailModal, WatchlistView,
                                  # SkeletonCard, EmptyState, Toast, ApiKeyModal
```

**Separation of concerns**

| Layer | Responsibility |
|---|---|
| `services/omdbApi.ts` | Builds URLs, calls `fetch`, passes the `AbortSignal` through, checks `response.ok`, turns failures into user-readable `Error`s. Returns typed data. |
| `hooks/` | Own the async logic and state (loading, error, pagination, cancellation). |
| `context/` | Owns the global watchlist. |
| `components/` | Render props and call callbacks. No `fetch`, no timers. |

---

## State management

**Search state: `useMovieSearch` (plain `useState` + `useRef`)**

Search state is local to the Discover screen, so it lives in one hook rather than in global state.

- `useState` holds what the UI renders: `movies`, `totalResults`, `isLoading`, `isLoadingMore`, `error`, `loadMoreError`.
- `useRef` holds things async code must read *at the moment it runs* and that must not cause re-renders:
  - `controllerRef`: the `AbortController` of the single request in flight. "Is something in flight?" is just `controllerRef.current !== null`.
  - `debounceTimerRef`: the pending 300 ms timer.
  - `pageRef`: the last page successfully loaded.
  - `committedRef`: the query and filter that produced the results currently on screen. "Load more" uses this, **not** the text currently in the input box.
- There are two kinds of request, and at most one runs at a time:
  `runSearch` (page 1, replaces results) and `loadMore` (page N+1, appends results, de-duplicated by `imdbID`).

**Watchlist state: `WatchlistContext` (Context + `useState`)**

The watchlist is needed by the navbar badge, every card, the modal and the watchlist tab, so it is global.

- All changes go through one `commit()` function: compute the next list from the latest list, store it in a ref, call `setItems(next)`.
- Handlers decide things (is it a duplicate? what should the toast say?) by reading that ref, so the logic never depends on a stale closure and no side effect runs inside a state-updater function.
- Initial state is read lazily from `localStorage`; a `useEffect` on `items` writes it back.
- **Why this is "optimistic":** `setItems` runs first, so the card flips to "Plan to Watch" in the next render. The `localStorage` write happens *after* that, in the effect, and the UI does not wait for it. (`localStorage` is synchronous and local, so in practice it finishes almost instantly; the ordering is what matters.)

**Detail modal: `useMovieDetails`**

Runs only while a movie is selected. Its effect creates an `AbortController` and aborts it in the cleanup, so closing the modal or picking another movie cancels the pending request.

---

## How the search request works

```
keystroke
  ├─ setQueryState(text)              input updates immediately
  ├─ abortActiveRequest()             cancel the request still in flight
  ├─ clearTimeout(previous timer)     restart the debounce
  └─ setTimeout(300ms) ─► runSearch   only fires if the user stops typing

runSearch:
  new AbortController ─► fetch(url, { signal })
  ├─ response arrives, signal NOT aborted ─► update state
  ├─ response arrives, signal aborted     ─► ignore it (it is stale)
  └─ fetch rejects with AbortError        ─► ignore it (we cancelled on purpose)
```

Key points:
- `fetch` only *rejects* on network failure. A 404/500 still resolves, so the service checks `response.ok` itself. OMDb also returns HTTP 200 with `{ "Response": "False", "Error": "..." }` for "not found", so the hook checks that field too.
- `abort()` makes the pending `fetch` promise reject with a `DOMException` named `AbortError`. The hook treats that as "not an error".
- Because the request is cancelled on every keystroke *and* the timer is restarted, typing "Dune" quickly sends **one** request (for `Dune`), not four.

---

## Technical challenge: keeping search and infinite scroll consistent under cancellation and failure

### 1. Out-of-order responses
Typing `bat` and then `batm` can produce responses in the wrong order: the slow `bat` response can arrive *after* `batm` and overwrite it. Debouncing alone does not prevent that, because the first request may already be on the wire when the next keystroke happens.

**Fix:** every request gets its own `AbortController`. A keystroke aborts the previous one, and every `await` is followed by `if (controller.signal.aborted) return;` before any state is touched. Only the latest request can update the UI.

A subtle follow-up bug: the `finally` block used to run `setIsLoading(false)` even for cancelled requests. A cancelled request's `finally` runs *after* the replacement request has already set `isLoading = true`, so it switched the spinner off while the new request was still running (the empty-state screen flashed on first load, and the app sent two requests on mount). The `finally` now touches the loading flags only if its own request was **not** aborted.

### 2. A failed page request caused an endless request loop
While testing with the network disabled I found that a failed "load more" request retried itself continuously:

1. the request fails, `isLoadingMore` goes `true → false`;
2. the sentinel's `IntersectionObserver` is re-created because its `enabled` / callback dependencies changed;
3. a newly created observer immediately reports the sentinel as visible → `loadMore()` again → back to step 1.

The same loop happened at the end of the results when OMDb returned "not found" for the page after the last one.

**Fix:** failures are now recorded in state and switch infinite scroll **off**:

```ts
const hasMore =
  movies.length > 0 &&
  movies.length < totalResults &&
  !reachedEnd &&            // OMDb said "no more pages"
  loadMoreError === null;   // the last page request failed
```

The observer is enabled only while `hasMore` is true, so a failure ends the loop. The user sees an inline "Retry loading more" button, and the results on screen stay put.

### 3. "Load more" must use the query that produced the visible results
`loadMore` reads `committedRef` (the query and filter of the last *successful* search) instead of the live text in the input. Without that, typing while the sentinel was visible could append page N of the *new* text to the *old* results. While a debounced search is pending, `loadMore` is also blocked.

### How I verified it
I ran the app in a headless browser with the OMDb endpoint mocked and checked: one request on first load, no empty-state flash, exactly pages 1–3 for a 25-result query, no extra requests after the last page, no retry loop when a page request fails (and Retry recovers), a cancelled `bat` request when `m` is typed, one request for fast typing, and persistence of the watchlist across a refresh.

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- npm 9 or newer

### Run locally

```bash
# 1. clone and enter the project
git clone <repository-url>
cd <repository-folder>

# 2. install dependencies
npm install

# 3. configure the API key (free key: https://www.omdbapi.com/apikey.aspx)
cp .env.example .env
#    then edit .env and set VITE_OMDB_API_KEY=your_key
#    (if no key is set, the app falls back to a shared demo key that may be rate-limited)

# 4. start the dev server
npm run dev          # opens http://localhost:5173

# 5. production build + local preview
npm run build        # runs `tsc` (type check) and then `vite build`
npm run preview
```

### Deploying (Vercel / Netlify)
- Build command: `npm run build`, output directory: `dist`.
- Add `VITE_OMDB_API_KEY` as an environment variable in the host's dashboard.
- Note: variables prefixed with `VITE_` are embedded in the browser bundle, so the key is visible to anyone who opens dev tools. That is acceptable for a free OMDb key, but do not reuse a key that matters.

---

## Requirements checklist

| Requirement | Where |
|---|---|
| Search input fetching from a public API | `SearchBar`, `useMovieSearch`, `omdbApi.searchMovies` |
| Title, year and poster for each result | `MovieCard` |
| Add / remove from the watchlist | `WatchlistContext` (`addToWatchlist`, `removeFromWatchlist`) |
| Duplicate prevention | `addToWatchlist` checks `imdbID` before inserting |
| Plan to Watch / Watched toggle | `WatchlistContext.toggleStatus` |
| React + TypeScript, clean components | `strict` TypeScript, presentational components |
| Data fetching separated from UI | `services/omdbApi.ts`, consumed only by hooks |
| Loading states | `SkeletonCard`, spinner in `SearchBar` |
| API errors and network drops | `fetchJson` in `omdbApi.ts`, error and retry UI in `MovieGrid` |
| Debounce 300 ms + `AbortController` | `useMovieSearch` |
| Infinite scroll | `useIntersectionObserver` + `MovieGrid` sentinel |
| Optimistic UI | `WatchlistContext.commit` (state first, storage after) |
| `localStorage` persistence | `WatchlistContext` |
| Detail view modal | `MovieDetailModal`, `useMovieDetails` |
| Responsive design | Tailwind responsive grid |
