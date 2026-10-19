import { Film, Compass, Bookmark, Key } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';

interface NavbarProps {
  activeTab: 'discover' | 'watchlist';
  onTabChange: (tab: 'discover' | 'watchlist') => void;
  onOpenApiKeyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenApiKeyModal,
}) => {
  const { items } = useWatchlist();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onTabChange('discover')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                CineScope
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              Movie Explorer & Watchlist
            </p>
          </div>
        </div>

        {/* Navigation Switcher */}
        <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange('discover')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('watchlist')}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist</span>
            {items.length > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 text-[11px] font-bold rounded-full ${
                  activeTab === 'watchlist'
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-600/80 text-white'
                }`}
              >
                {items.length}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions: API Key & Info */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
            title="Configure API Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">API Config</span>
          </button>
        </div>
      </div>
    </header>
  );
};
