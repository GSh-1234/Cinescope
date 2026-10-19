import { Movie } from './movie';

export type WatchlistStatus = 'PLAN_TO_WATCH' | 'WATCHED';

export interface WatchlistItem {
  movie: Movie;
  status: WatchlistStatus;
  addedAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export type WatchlistFilter = 'ALL' | 'PLAN_TO_WATCH' | 'WATCHED';

