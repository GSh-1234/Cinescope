import React from 'react';
import { Search, X, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { MovieFilterType } from '../types/movie';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  filterType: MovieFilterType;
  onFilterChange: (type: MovieFilterType) => void;
  isLoading: boolean;
}

const POPULAR_SUGGESTIONS = [
  'Batman',
  'Avengers',
  'Interstellar',
  'Inception',
  'Spider-Man',
  'Dune',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  filterType,
  onFilterChange,
  isLoading,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Main Search Input & Filter Group */}
      <div className="relative flex flex-col sm:flex-row gap-2.5 items-stretch">
        {/* Search Input Bar */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search movies, series, or franchises (e.g. Inception, Marvel)..."
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-400 text-sm md:text-base outline-none transition-all shadow-inner"
          />

          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Type Selector */}
        <div className="relative flex items-center">
          <div className="relative w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => onFilterChange(e.target.value as MovieFilterType)}
              className="w-full sm:w-auto appearance-none bg-slate-900/90 text-slate-200 border border-slate-700/80 rounded-xl px-4 py-3.5 pr-10 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:border-slate-600 transition-all"
            >
              <option value="all">All Formats</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
              <option value="episode">Episodes</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Search Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-xs no-scrollbar">
        <span className="inline-flex items-center gap-1 text-slate-400 font-medium whitespace-nowrap pl-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Trending:
        </span>
        {POPULAR_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onQueryChange(suggestion)}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
              query.toLowerCase() === suggestion.toLowerCase()
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 font-medium'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

