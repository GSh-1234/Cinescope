import React, { useState, useMemo } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { WatchlistFilter, WatchlistItem } from '../types/watchlist';
import { MovieCard } from './MovieCard';
import { EmptyState } from './EmptyState';
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpDown,
  Trash2,
  Film,
  Sparkles,
} from 'lucide-react';

interface WatchlistViewProps {
  onSelectMovie: (imdbID: string) => void;
  onExploreMovies: () => void;
}

type SortOption = 'recent' | 'title' | 'year-desc' | 'year-asc';

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectMovie,
  onExploreMovies,
}) => {
  const { items, clearWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<WatchlistFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute counts for tabs
  const counts = useMemo(() => {
    const total = items.length;
    const plan = items.filter((i) => i.status === 'PLAN_TO_WATCH').length;
    const watched = items.filter((i) => i.status === 'WATCHED').length;
    return { total, plan, watched };
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by status tab
    if (filter === 'PLAN_TO_WATCH') {
      result = result.filter((i) => i.status === 'PLAN_TO_WATCH');
    } else if (filter === 'WATCHED') {
      result = result.filter((i) => i.status === 'WATCHED');
    }

    // Filter by search query within watchlist
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) =>
        i.movie.Title.toLowerCase().includes(q)
      );
    }

    // Sort items
    result.sort((a: WatchlistItem, b: WatchlistItem) => {
      switch (sortBy) {
        case 'title':
          return a.movie.Title.localeCompare(b.movie.Title);
        case 'year-desc':
          return parseInt(b.movie.Year || '0', 10) - parseInt(a.movie.Year || '0', 10);
        case 'year-asc':
          return parseInt(a.movie.Year || '0', 10) - parseInt(b.movie.Year || '0', 10);
        case 'recent':
        default:
          return b.addedAt - a.addedAt;
      }
    });

    return result;
  }, [items, filter, searchQuery, sortBy]);

  if (items.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon={<Bookmark className="w-10 h-10 text-indigo-400 stroke-[1.5]" />}
          title="Your Watchlist is Empty"
          description="You haven't saved any movies or series yet. Browse the Discover catalog and click '+ Watchlist' to start building your personal collection."
          actionLabel="Explore Movies"
          onAction={onExploreMovies}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>My Watchlist</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {items.length} {items.length === 1 ? 'Title' : 'Titles'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persisted automatically to localStorage with instant optimistic state synchronization.
          </p>
        </div>

        {/* Clear All Watchlist Action */}
        <div>
          {showClearConfirm ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-rose-500/40 p-1.5 rounded-xl animate-fade-in">
              <span className="text-xs text-rose-300 font-medium pl-2">Clear all?</span>
              <button
                type="button"
                onClick={() => {
                  clearWatchlist();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Watchlist</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Titles</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('PLAN_TO_WATCH')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === 'PLAN_TO_WATCH'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Plan to Watch</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'PLAN_TO_WATCH'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {counts.plan}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('WATCHED')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === 'WATCHED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Watched</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === 'WATCHED'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {counts.watched}
            </span>
          </button>
        </div>

        {/* Search within watchlist & Sort options */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Watchlist Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter saved titles..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative w-full sm:w-auto flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto appearance-none bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="year-desc">Year (Newest)</option>
              <option value="year-asc">Year (Oldest)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5" />
          </div>
        </div>
      </div>

      {/* Grid of Watchlist Items */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="py-12 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <EmptyState
            icon={<Film className="w-8 h-8 text-slate-500 stroke-[1.5]" />}
            title="No Matching Movies in Watchlist"
            description={
              searchQuery
                ? `No saved movies match "${searchQuery}". Try a different term or clear the filter.`
                : 'No movies found in this tab.'
            }
            actionLabel={searchQuery ? 'Clear Filter' : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
          {filteredAndSortedItems.map((item) => (
            <MovieCard
              key={item.movie.imdbID}
              movie={item.movie}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      )}

      {/* Watchlist Tips Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tip: Click on any card to view extended cast, plot, and reviews.</span>
        </div>
        <span>{filteredAndSortedItems.length} items shown</span>
      </div>
    </div>
  );
};

