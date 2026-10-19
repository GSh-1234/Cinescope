import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { MovieGrid } from './components/MovieGrid';
import { WatchlistView } from './components/WatchlistView';
import { MovieDetailModal } from './components/MovieDetailModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ToastContainer } from './components/Toast';
import { useMovieSearch } from './hooks/useMovieSearch';
import { Clapperboard, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'watchlist'>('discover');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const {
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
  } = useMovieSearch('Batman');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeTab === 'discover' ? (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-3 pt-2 sm:pt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Live Search &bull; AbortController &bull; Infinite Scroll
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Discover Cinematic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Masterpieces</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                Explore movies and series in real time with 300ms debouncing, race condition prevention, and instant watchlist tracking.
              </p>
            </div>

            {/* Search Bar Section */}
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              filterType={filterType}
              onFilterChange={setFilterType}
              isLoading={isLoading}
            />

            {/* Movie Grid Section with Infinite Scrolling */}
            <MovieGrid
              movies={movies}
              totalResults={totalResults}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              error={error}
              loadMoreError={loadMoreError}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onRetryLoadMore={retryLoadMore}
              onSelectMovie={(id) => setSelectedMovieId(id)}
              onRetry={refresh}
              query={query}
            />
          </div>
        ) : (
          /* Watchlist View */
          <WatchlistView
            onSelectMovie={(id) => setSelectedMovieId(id)}
            onExploreMovies={() => setActiveTab('discover')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-400 font-medium">
          <Clapperboard className="w-4 h-4 text-indigo-400" />
          <span>CineScope Movie Explorer</span>
          <span>&bull;</span>
          <span>Built with React, TypeScript &amp; Tailwind CSS</span>
        </div>
        <p className="text-slate-600">
          Powered by OMDb API. Built for Second-Year Recruitment Assessment.
        </p>
      </footer>

      {/* Detail View Modal */}
      <MovieDetailModal
        imdbID={selectedMovieId}
        onClose={() => setSelectedMovieId(null)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyChanged={refresh}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer />
    </div>
  );
};

export default App;
