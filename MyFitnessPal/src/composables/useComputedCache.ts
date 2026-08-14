/**
 * A simple key-value cache for expensive computed results.
 *
 * Usage:
 *   const cache = useComputedCache<WeeklySummary>()
 *   cache.set('2024-W01', result)
 *   cache.get('2024-W01')   // returns cached value or undefined
 *   cache.invalidate()      // clear all entries
 */
export function useComputedCache<T>() {
  const store = new Map<string, T>()

  /**
   * Retrieves a cached value by key.
   * @param key - Cache key to look up
   * @returns The cached value, or `undefined` if not present
   */
  function get(key: string): T | undefined {
    return store.get(key)
  }

  /**
   * Stores a value under the given key, overwriting any existing entry.
   * @param key - Cache key
   * @param value - Value to cache
   */
  function set(key: string, value: T): void {
    store.set(key, value)
  }

  /**
   * Returns whether a value exists for the given key.
   * @param key - Cache key to check
   * @returns `true` if the key is present
   */
  function has(key: string): boolean {
    return store.has(key)
  }

  /**
   * Clears all entries from the cache.
   */
  function invalidate(): void {
    store.clear()
  }

  /**
   * Removes a single entry from the cache by key.
   * @param key - Cache key to remove
   */
  function invalidateKey(key: string): void {
    store.delete(key)
  }

  return { get, set, has, invalidate, invalidateKey }
}
