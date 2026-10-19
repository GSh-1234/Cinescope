import React, { useEffect, useState } from 'react';
import {
  X,
  Star,
  Calendar,
  Clock,
  Award,
  Users,
  Film,
  Bookmark,
  BookmarkCheck,
  Check,
  DollarSign,
  Globe,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useWatchlist } from '../context/WatchlistContext';
import { Movie } from '../types/movie';

interface MovieDetailModalProps {
  imdbID: string | null;
  onClose: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ imdbID, onClose }) => {
  const { movieDetails, isLoading, error } = useMovieDetails(imdbID);
  const { isInWatchlist, getWatchlistItem, addToWatchlist, removeFromWatchlist, toggleStatus } =
    useWatchlist();
  const [imageError, setImageError] = useState(false);

  // Lock body scroll while modal is mounted
  useEffect(() => {
    if (imdbID) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [imdbID]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imdbID) return null;

  const inWatchlist = isInWatchlist(imdbID);
  const watchlistItem = getWatchlistItem(imdbID);

  const handleWatchlistAction = () => {
    if (!movieDetails) return;
    const movieObj: Movie = {
      Title: movieDetails.Title,
      Year: movieDetails.Year,
      imdbID: movieDetails.imdbID,
      Type: movieDetails.Type || 'movie',
      Poster: movieDetails.Poster,
    };

    if (inWatchlist) {
      toggleStatus(imdbID);
    } else {
      addToWatchlist(movieObj, 'PLAN_TO_WATCH');
    }
  };

  const handleRemoveFromWatchlist = () => {
    removeFromWatchlist(imdbID);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all backdrop-blur-sm"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[420px] p-8 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-400">Loading complete movie details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center space-y-3">
            <p className="text-rose-400 font-semibold">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
            >
              Close
            </button>
          </div>
        ) : movieDetails ? (
          <div>
            {/* Modal Hero / Backdrop Section */}
            <div className="relative flex flex-col md:flex-row gap-6 p-6 sm:p-8 bg-gradient-to-b from-slate-800/40 via-slate-900 to-slate-900">
              {/* Poster Column */}
              <div className="flex-shrink-0 mx-auto md:mx-0 w-44 sm:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950">
                {movieDetails.Poster && movieDetails.Poster !== 'N/A' && !imageError ? (
                  <img
                    src={movieDetails.Poster}
                    alt={movieDetails.Title}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-500 text-center">
                    <Film className="w-12 h-12 mb-2 stroke-[1.5]" />
                    <span className="text-xs">No Poster Available</span>
                  </div>
                )}
              </div>

              {/* Header Info Column */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {movieDetails.Type || 'Movie'}
                    </span>
                    {movieDetails.Rated && movieDetails.Rated !== 'N/A' && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {movieDetails.Rated}
                      </span>
                    )}
                    {movieDetails.Runtime && movieDetails.Runtime !== 'N/A' && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {movieDetails.Runtime}
                      </span>
                    )}
                    {movieDetails.Released && movieDetails.Released !== 'N/A' && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {movieDetails.Released}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {movieDetails.Title}
                  </h2>

                  {/* Genres */}
                  {movieDetails.Genre && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {movieDetails.Genre.split(',').map((g) => (
                        <span
                          key={g.trim()}
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ratings Badges */}
                <div className="flex flex-wrap items-center gap-3 py-2 border-y border-slate-800">
                  {movieDetails.imdbRating && movieDetails.imdbRating !== 'N/A' && (
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-amber-300 leading-none">
                          {movieDetails.imdbRating}
                          <span className="text-xs font-normal text-amber-400/70">/10</span>
                        </span>
                        <span className="text-[10px] text-amber-400/60">
                          {movieDetails.imdbVotes} votes
                        </span>
                      </div>
                    </div>
                  )}

                  {movieDetails.Metascore && movieDetails.Metascore !== 'N/A' && (
                    <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
                      <span className="text-xs text-slate-400">Metascore:</span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {movieDetails.Metascore}
                      </span>
                    </div>
                  )}

                  {movieDetails.BoxOffice && movieDetails.BoxOffice !== 'N/A' && (
                    <div className="inline-flex items-center gap-1 text-xs text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{movieDetails.BoxOffice}</span>
                    </div>
                  )}
                </div>

                {/* Watchlist Actions in Modal */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleWatchlistAction}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg active:scale-95 ${
                      !inWatchlist
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        : watchlistItem?.status === 'WATCHED'
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {!inWatchlist ? (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span>Add to Watchlist</span>
                      </>
                    ) : watchlistItem?.status === 'WATCHED' ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                        <span>Watched (Click to switch to Plan to Watch)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-sky-400" />
                        <span>Plan to Watch (Click to mark Watched)</span>
                      </>
                    )}
                  </button>

                  {inWatchlist && (
                    <button
                      type="button"
                      onClick={handleRemoveFromWatchlist}
                      title="Remove from Watchlist"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Extended Details Section */}
            <div className="p-6 sm:p-8 space-y-5 bg-slate-900/60 border-t border-slate-800">
              {/* Plot Synopsis */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                  Synopsis
                </h4>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {movieDetails.Plot && movieDetails.Plot !== 'N/A'
                    ? movieDetails.Plot
                    : 'No plot synopsis available for this title.'}
                </p>
              </div>

              {/* Cast & Crew Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 text-sm">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">
                    Director
                  </span>
                  <span className="text-slate-200">{movieDetails.Director || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">
                    Writer(s)
                  </span>
                  <span className="text-slate-200">{movieDetails.Writer || 'N/A'}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    Starring
                  </span>
                  <p className="text-slate-200">{movieDetails.Actors || 'N/A'}</p>
                </div>
              </div>

              {/* Extra Metadata Footer */}
              {(movieDetails.Awards !== 'N/A' || movieDetails.Country !== 'N/A') && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
                  {movieDetails.Awards && movieDetails.Awards !== 'N/A' && (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{movieDetails.Awards}</span>
                    </div>
                  )}
                  {movieDetails.Country && movieDetails.Country !== 'N/A' && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>
                        {movieDetails.Country} {movieDetails.Language !== 'N/A' && `(${movieDetails.Language})`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

