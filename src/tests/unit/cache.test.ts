import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStorageCache, useDataCache, clearEquipmentCache, CACHE_CONFIG } from '@/utils/cache';

describe('Cache Utility Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useStorageCache', () => {
    it('should return cache functions', () => {
      const { result } = renderHook(() => useStorageCache('test-key'));

      expect(result.current).toHaveProperty('getCachedUrls');
      expect(result.current).toHaveProperty('setCachedUrls');
      expect(result.current).toHaveProperty('clearCache');
      expect(typeof result.current.getCachedUrls).toBe('function');
      expect(typeof result.current.setCachedUrls).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
    });

    it('should cache and retrieve URLs', () => {
      const { result } = renderHook(() => useStorageCache('test-storage-key'));

      const urlMap = new Map<string, string>([
        ['path1.jpg', 'https://example.com/path1.jpg?token=abc'],
        ['path2.jpg', 'https://example.com/path2.jpg?token=def'],
      ]);

      act(() => {
        result.current.setCachedUrls(urlMap);
      });

      const cached = result.current.getCachedUrls(['path1.jpg', 'path2.jpg']);

      expect(cached).not.toBeNull();
      expect(cached?.size).toBe(2);
      expect(cached?.get('path1.jpg')).toBe('https://example.com/path1.jpg?token=abc');
      expect(cached?.get('path2.jpg')).toBe('https://example.com/path2.jpg?token=def');
    });

    it('should return null if not all paths are cached', () => {
      const { result } = renderHook(() => useStorageCache('test-storage-key'));

      const urlMap = new Map<string, string>([
        ['path1.jpg', 'https://example.com/path1.jpg?token=abc'],
      ]);

      act(() => {
        result.current.setCachedUrls(urlMap);
      });

      // Request more paths than cached
      const cached = result.current.getCachedUrls(['path1.jpg', 'path2.jpg']);

      expect(cached).toBeNull();
    });

    it('should expire URLs after configured TTL', () => {
      const { result } = renderHook(() => useStorageCache('test-storage-key'));

      const urlMap = new Map<string, string>([
        ['path1.jpg', 'https://example.com/path1.jpg?token=abc'],
      ]);

      act(() => {
        result.current.setCachedUrls(urlMap);
      });

      // Verify cached immediately
      let cached = result.current.getCachedUrls(['path1.jpg']);
      expect(cached).not.toBeNull();

      // Advance time past TTL (50 minutes)
      act(() => {
        vi.advanceTimersByTime(CACHE_CONFIG.storageUrls + 1000);
      });

      // Should be expired now
      cached = result.current.getCachedUrls(['path1.jpg']);
      expect(cached).toBeNull();
    });

    it('should clear cache', () => {
      const { result } = renderHook(() => useStorageCache('test-storage-key'));

      const urlMap = new Map<string, string>([
        ['path1.jpg', 'https://example.com/path1.jpg?token=abc'],
      ]);

      act(() => {
        result.current.setCachedUrls(urlMap);
      });

      // Verify cached
      let cached = result.current.getCachedUrls(['path1.jpg']);
      expect(cached).not.toBeNull();

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      // Should be null after clear
      cached = result.current.getCachedUrls(['path1.jpg']);
      expect(cached).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const { result } = renderHook(() => useStorageCache('test-storage-key'));

      // Manually set invalid JSON
      sessionStorage.setItem('test-storage-key', 'invalid-json{');

      const cached = result.current.getCachedUrls(['path1.jpg']);
      expect(cached).toBeNull();
    });

    it('should merge new URLs with existing cache', () => {
      const { result } = renderHook(() => useStorageCache('test-storage-key'));

      const urlMap1 = new Map<string, string>([
        ['path1.jpg', 'https://example.com/path1.jpg?token=abc'],
      ]);

      const urlMap2 = new Map<string, string>([
        ['path2.jpg', 'https://example.com/path2.jpg?token=def'],
      ]);

      act(() => {
        result.current.setCachedUrls(urlMap1);
        result.current.setCachedUrls(urlMap2);
      });

      // Both should be cached
      const cached = result.current.getCachedUrls(['path1.jpg', 'path2.jpg']);
      expect(cached).not.toBeNull();
      expect(cached?.size).toBe(2);
    });
  });

  describe('useDataCache', () => {
    interface TestData {
      id: string;
      value: number;
    }

    it('should return cache functions', () => {
      const { result } = renderHook(() => useDataCache<TestData>('test-data-key'));

      expect(result.current).toHaveProperty('getCachedData');
      expect(result.current).toHaveProperty('setCachedData');
      expect(result.current).toHaveProperty('clearCache');
    });

    it('should cache and retrieve data', () => {
      const { result } = renderHook(() => useDataCache<TestData>('test-data-key'));

      const testData: TestData = { id: 'test-1', value: 42 };

      act(() => {
        result.current.setCachedData(testData);
      });

      const cached = result.current.getCachedData();

      expect(cached).not.toBeNull();
      expect(cached?.id).toBe('test-1');
      expect(cached?.value).toBe(42);
    });

    it('should return null when no data cached', () => {
      const { result } = renderHook(() => useDataCache<TestData>('test-data-key'));

      const cached = result.current.getCachedData();
      expect(cached).toBeNull();
    });

    it('should expire data after configured TTL', () => {
      const { result } = renderHook(() => useDataCache<TestData>('test-data-key'));

      const testData: TestData = { id: 'test-1', value: 42 };

      act(() => {
        result.current.setCachedData(testData);
      });

      // Verify cached immediately
      let cached = result.current.getCachedData();
      expect(cached).not.toBeNull();

      // Advance time past TTL (5 minutes)
      act(() => {
        vi.advanceTimersByTime(CACHE_CONFIG.databaseData + 1000);
      });

      // Should be expired and removed
      cached = result.current.getCachedData();
      expect(cached).toBeNull();

      // Verify it was removed from sessionStorage
      expect(sessionStorage.getItem('test-data-key')).toBeNull();
    });

    it('should clear cache', () => {
      const { result } = renderHook(() => useDataCache<TestData>('test-data-key'));

      const testData: TestData = { id: 'test-1', value: 42 };

      act(() => {
        result.current.setCachedData(testData);
      });

      // Verify cached
      let cached = result.current.getCachedData();
      expect(cached).not.toBeNull();

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      // Should be null after clear
      cached = result.current.getCachedData();
      expect(cached).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const { result } = renderHook(() => useDataCache<TestData>('test-data-key'));

      // Manually set invalid JSON
      sessionStorage.setItem('test-data-key', 'invalid-json{');

      const cached = result.current.getCachedData();
      expect(cached).toBeNull();
    });

    it('should cache complex objects', () => {
      interface ComplexData {
        id: string;
        nested: {
          array: number[];
          obj: { key: string };
        };
      }

      const { result } = renderHook(() => useDataCache<ComplexData>('test-complex-key'));

      const complexData: ComplexData = {
        id: 'complex-1',
        nested: {
          array: [1, 2, 3],
          obj: { key: 'value' },
        },
      };

      act(() => {
        result.current.setCachedData(complexData);
      });

      const cached = result.current.getCachedData();

      expect(cached).not.toBeNull();
      expect(cached?.nested.array).toEqual([1, 2, 3]);
      expect(cached?.nested.obj.key).toBe('value');
    });
  });

  describe('clearEquipmentCache', () => {
    it('should clear all equipment-related cache keys', () => {
      const equipmentId = 'equipment-123';

      // Set cache for various equipment-related keys
      sessionStorage.setItem(`storage:images:${equipmentId}`, JSON.stringify({ test: 'data' }));
      sessionStorage.setItem(`storage:files:${equipmentId}`, JSON.stringify({ test: 'data' }));
      sessionStorage.setItem(`data:logs:${equipmentId}`, JSON.stringify({ test: 'data' }));
      sessionStorage.setItem(`data:summary:${equipmentId}`, JSON.stringify({ test: 'data' }));

      // Verify items exist
      expect(sessionStorage.getItem(`storage:images:${equipmentId}`)).not.toBeNull();
      expect(sessionStorage.getItem(`storage:files:${equipmentId}`)).not.toBeNull();
      expect(sessionStorage.getItem(`data:logs:${equipmentId}`)).not.toBeNull();
      expect(sessionStorage.getItem(`data:summary:${equipmentId}`)).not.toBeNull();

      // Clear equipment cache
      clearEquipmentCache(equipmentId);

      // All should be cleared
      expect(sessionStorage.getItem(`storage:images:${equipmentId}`)).toBeNull();
      expect(sessionStorage.getItem(`storage:files:${equipmentId}`)).toBeNull();
      expect(sessionStorage.getItem(`data:logs:${equipmentId}`)).toBeNull();
      expect(sessionStorage.getItem(`data:summary:${equipmentId}`)).toBeNull();
    });

    it('should not affect other equipment caches', () => {
      const equipmentId1 = 'equipment-123';
      const equipmentId2 = 'equipment-456';

      // Set cache for both equipments
      sessionStorage.setItem(`storage:images:${equipmentId1}`, JSON.stringify({ test: 'data1' }));
      sessionStorage.setItem(`storage:images:${equipmentId2}`, JSON.stringify({ test: 'data2' }));

      // Clear only equipment 1
      clearEquipmentCache(equipmentId1);

      // Equipment 1 should be cleared, equipment 2 should remain
      expect(sessionStorage.getItem(`storage:images:${equipmentId1}`)).toBeNull();
      expect(sessionStorage.getItem(`storage:images:${equipmentId2}`)).not.toBeNull();
    });

    it('should handle errors gracefully', () => {
      // Mock sessionStorage.removeItem to throw
      const originalRemoveItem = sessionStorage.removeItem;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      sessionStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => clearEquipmentCache('equipment-123')).not.toThrow();

      // Should have logged warning
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Restore
      sessionStorage.removeItem = originalRemoveItem;
      consoleWarnSpy.mockRestore();
    });
  });

  describe('CACHE_CONFIG', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_CONFIG.storageUrls).toBe(50 * 60 * 1000); // 50 minutes
      expect(CACHE_CONFIG.databaseData).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('storage URL TTL should be less than Supabase expiry', () => {
      const supabaseExpiry = 60 * 60 * 1000; // 1 hour
      expect(CACHE_CONFIG.storageUrls).toBeLessThan(supabaseExpiry);
    });
  });
});
