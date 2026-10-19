import React, { useState } from 'react';
import { Film, Bookmark, BookmarkCheck, Check, Clock, Trash2, Eye } from 'lucide-react';
import { Movie } from '../types/movie';
import { useWatchlist } from '../context/WatchlistContext';

interface MovieCardProps {
  movie: Movie;
  onSelect: (imdbID: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect }) => {
  const { isInWatchlist, getWatchlistItem, addToWatchlist, removeFromWatchlist, toggleStatus } =
    useWatchlist();
  const [imageError, setImageError] = useState(false);

  const watchlistItem = getWatchlistItem(movie.imdbID);
  const inWatchlist = isInWatchlist(movie.imdbID);

  const hasValidPoster = movie.Poster && movie.Poster !== 'N/A' && !imageError;

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      toggleStatus(movie.imdbID);
    } else {
      addToWatchlist(movie, 'PLAN_TO_WATCH');
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWatchlist(movie.imdbID);
  };

  return (
    <div
      onClick={() => onSelect(movie.imdbID)}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer select-none"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {hasValidPoster ? (
          <img
            src={movie.Poster}
            alt={movie.Title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500 text-center">
            <Film className="w-12 h-12 mb-2 text-slate-600 stroke-[1.5]" />
            <span className="text-xs font-medium text-slate-400 line-clamp-2">{movie.Title}</span>
            <span className="text-[10px] text-slate-600 mt-1">No Poster Available</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {/* Type Badge */}
          <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-md bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800/80">
            {movie.Type || 'Movie'}
          </span>

          {/* Quick Watchlist Status Badge if added */}
          {inWatchlist && (
            <div className="pointer-events-auto">
              {watchlistItem?.status === 'WATCHED' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Watched
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 backdrop-blur-md">
                  <Clock className="w-3 h-3" />
                  Plan to Watch
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-xs font-medium text-white border border-slate-700 shadow-xl">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            View Details
          </span>
        </div>
      </div>

      {/* Info Content */}
      <div className="flex flex-col flex-1 p-3.5 justify-between">
        <div>
          <h3
            className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1"
            title={movie.Title}
          >
            {movie.Title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
            <span>{movie.Year}</span>
            <span className="text-[11px] text-slate-500 font-mono">#{movie.imdbID.slice(2, 8)}</span>
          </div>
        </div>

        {/* Watchlist Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5">
          {inWatchlist ? (
            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={handleWatchlistClick}
                title={
                  watchlistItem?.status === 'WATCHED'
                    ? 'Click to switch to Plan to Watch'
                    : 'Click to mark as Watched'
                }
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  watchlistItem?.status === 'WATCHED'
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                    : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
                }`}
              >
                {watchlistItem?.status === 'WATCHED' ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Watched</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Plan to Watch</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRemoveClick}
                title="Remove from Watchlist"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleWatchlistClick}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/80 hover:border-indigo-500 transition-all active:scale-95"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>+ Watchlist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

