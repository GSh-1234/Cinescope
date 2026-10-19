import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg animate-pulse">
      {/* Poster Skeleton */}
      <div className="relative aspect-[2/3] w-full bg-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
      </div>

      {/* Info Skeleton */}
      <div className="flex flex-col flex-1 p-3.5 space-y-2.5">
        <div className="h-4 bg-slate-800 rounded w-4/5" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 bg-slate-800 rounded w-1/4" />
          <div className="h-3 bg-slate-800 rounded w-1/5" />
        </div>
        <div className="h-7 bg-slate-800/60 rounded-lg w-full mt-2" />
      </div>
    </div>
  );
};

