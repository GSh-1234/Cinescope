import { useState, useEffect, useRef } from 'react';
import { MovieDetails } from '../types/movie';
import { getMovieDetails } from '../services/omdbApi';

interface UseMovieDetailsResult {
  movieDetails: MovieDetails | null;
  isLoading: boolean;
  error: string | null;
}

export function useMovieDetails(imdbID: string | null): UseMovieDetailsResult {
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!imdbID) {
      setMovieDetails(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setMovieDetails(null);

    getMovieDetails({ imdbID, signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setMovieDetails(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const message = err instanceof Error ? err.message : 'Failed to load movie details.';
        setError(message);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [imdbID]);

  return { movieDetails, isLoading, error };
}

