// Cache utilities for Equipment Details
import { useMemo } from "react";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Cache configuration
export const CACHE_CONFIG = {
  storageUrls: 50 * 60 * 1000, // 50 minutes (safe margin before 1-hour Supabase expiry)
  databaseData: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Storage URL Cache Hook
 * Caches Supabase Storage signed URLs by file path
 * Does NOT cache metadata (is_primary, etc) - only URLs
 */
export function useStorageCache(cacheKey: string) {
  const getCachedUrls = (paths: string[]): Map<string, string> | null => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const entries: Record<string, CacheEntry<string>> = JSON.parse(cached);
      const now = Date.now();
      const validUrls = new Map<string, string>();

      // Check each path for valid cached URL
      for (const path of paths) {
        const entry = entries[path];
        if (entry && entry.expiresAt > now) {
          validUrls.set(path, entry.data);
        }
      }

      // Return null if we don't have all paths cached
      if (validUrls.size !== paths.length) return null;

      return validUrls;
    } catch {
      return null;
    }
  };

  const setCachedUrls = (urlMap: Map<string, string>) => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      const existing: Record<string, CacheEntry<string>> = cached
        ? JSON.parse(cached)
        : {};

      const expiresAt = Date.now() + CACHE_CONFIG.storageUrls;

      // Add new URLs to cache
      urlMap.forEach((url, path) => {
        existing[path] = { data: url, expiresAt };
      });

      sessionStorage.setItem(cacheKey, JSON.stringify(existing));
    } catch (error) {
      console.warn("Failed to cache URLs:", error);
    }
  };

  const clearCache = () => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  };

  // Return stable object reference across renders (only changes when cacheKey changes)
  return useMemo(
    () => ({ getCachedUrls, setCachedUrls, clearCache }),
    [cacheKey]
  );
}

/**
 * Data Cache Hook
 * Caches database query results (logs, summary, etc.)
 */
export function useDataCache<T>(cacheKey: string) {
  const getCachedData = (): T | null => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      if (entry.expiresAt > now) {
        return entry.data;
      }

      // Expired - remove it
      sessionStorage.removeItem(cacheKey);
      return null;
    } catch {
      return null;
    }
  };

  const setCachedData = (data: T) => {
    try {
      const expiresAt = Date.now() + CACHE_CONFIG.databaseData;
      const entry: CacheEntry<T> = { data, expiresAt };
      sessionStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.warn("Failed to cache data:", error);
    }
  };

  const clearCache = () => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  };

  // Return stable object reference across renders (only changes when cacheKey changes)
  return useMemo(
    () => ({ getCachedData, setCachedData, clearCache }),
    [cacheKey]
  );
}

/**
 * Clear all caches for an equipment (useful on logout or major changes)
 */
export function clearEquipmentCache(equipmentId: string) {
  try {
    const keysToRemove = [
      `storage:images:${equipmentId}`,
      `storage:files:${equipmentId}`,
      `data:logs:${equipmentId}`,
      `data:summary:${equipmentId}`,
    ];

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to clear equipment cache:", error);
  }
}
