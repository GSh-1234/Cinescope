import React from 'react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Film, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface MovieGridProps {
  movies: Movie[];
  totalResults: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetryLoadMore: () => void;
  onSelectMovie: (imdbID: string) => void;
  onRetry: () => void;
  query: string;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  totalResults,
  isLoading,
  isLoadingMore,
  error,
  loadMoreError,
  hasMore,
  onLoadMore,
  onRetryLoadMore,
  onSelectMovie,
  onRetry,
  query,
}) => {
  // Sentinel for infinite scrolling
  const sentinelRef = useIntersectionObserver({
    enabled: hasMore && !isLoading && !isLoadingMore,
    rootMargin: '400px',
    onIntersect: onLoadMore,
  });

  // Initial loading state: display skeleton grid
  if (isLoading && movies.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  // Error state: either OMDb said "no results" or the request itself failed.
  if (error && movies.length === 0) {
    // "Not found" style answers can't be fixed by retrying the same request;
    // network / server failures can.
    const isNoResults = error === 'Movie not found!' || error === 'Too many results.';

    let description = error;
    if (error === 'Movie not found!') {
      description = `No movies matched "${query}". Please check your spelling or try another keyword.`;
    } else if (error === 'Too many results.') {
      description = `"${query}" matches too many titles. Try a longer or more specific title.`;
    }

    return (
      <div className="py-12">
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 text-amber-400 stroke-[1.5]" />}
          title={isNoResults ? 'No Results' : 'Something Went Wrong'}
          description={description}
          actionLabel={isNoResults ? undefined : 'Retry'}
          onAction={isNoResults ? undefined : onRetry}
        />
      </div>
    );
  }

  // Empty state: No query or no results
  if (!isLoading && movies.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<Film className="w-10 h-10 text-indigo-400 stroke-[1.5]" />}
          title="Explore Cinematic Gems"
          description="Type in a movie title, franchise, or actor in the search bar above to discover titles."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header Info */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 px-1 border-b border-slate-800/60 pb-3">
        <div>
          Showing <span className="font-semibold text-slate-200">{movies.length}</span> of{' '}
          <span className="font-semibold text-indigo-400">{totalResults}</span> titles for{' '}
          <span className="text-slate-200 font-medium italic">"{query}"</span>
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Infinite scroll enabled
        </div>
      </div>

      {/* Responsive Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
        {movies.map((movie) => (
          <MovieCard key={movie.imdbID} movie={movie} onSelect={onSelectMovie} />
        ))}
      </div>

      {/* Infinite Scroll Sentinel & Loading More Indicator */}
      <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center">
        {isLoadingMore && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading more movies...</span>
            </div>
            {/* Row of mini skeleton cards while fetching page */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 mt-4 opacity-75">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonCard key={`more-${idx}`} />
              ))}
            </div>
          </div>
        )}

        {loadMoreError && !isLoadingMore && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300">
              <AlertCircle className="w-4 h-4" />
              <span>{loadMoreError}</span>
            </div>
            <button
              type="button"
              onClick={onRetryLoadMore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry loading more
            </button>
          </div>
        )}

        {!hasMore && !loadMoreError && movies.length > 0 && !isLoading && !isLoadingMore && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800/80 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>You've reached the end of the results</span>
          </div>
        )}
      </div>
    </div>
  );
};

