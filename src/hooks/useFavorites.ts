import { useState, useCallback } from 'react';
import { DownloadJob } from '../types';

const STORAGE_KEY = 'unistream_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((jobId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (jobId: string) => favorites.includes(jobId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
