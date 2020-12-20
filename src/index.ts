import LRU from 'lru-cache';

/**
 * Small utility around an LRU cache that gives us some features:
 *  - Promisification: Async ready to easily change to a memcached/redis implementation
 *  - Improved get method, to make more expressive usage of the pattern "if not found
 *  in the cache, go get it, store in the cache, and return the value"
 *  - Funnel values: Promises are stored and returned, so if the value for a key
 *  is being obtained while another get is requested, the promise of the value is returned
 *  so only one request for value is done
 */
export class Cache<K, V = unknown> {
  lru: LRU<K, Promise<V>>;
  constructor(opt?: LRU.Options<K, Promise<V>>) {
    this.lru = new LRU(opt);
  }

  /**
   * Gets a value from the cache. When an optional getter method is provided,
   * it will be called when there is a cache miss to get the value and store
   * it in the cache.
   * When the getter method throws/rejects, it will be propagated down the chain
   *
   * ```js
   *    // Old Way (Sync code)
   *    let value = cache.get(key);
   *    if (!value) {
   *      value = calculateValue();
   *      cache.put(key, value);
   *    }
   *    return value;
   * ```
   *    that becomes
   * ```js
   *    return cache.get(key, calculateValue);
   * ```
   *
   * @param {String} key the cache entry key
   * @param {Function} [getter] the function to call when a value is not found
   *    in the cache. Return promise or a discrete value, that will be
   *    stored in the cache for that key
   * @returns {Promise.<V>} the cache entry
   */
  async get(key: K, getter?: () => Promise<V> | V, maxAge?: number): Promise<V | undefined> {
    const inCache = this.lru.get(key);
    if (inCache) {
      return inCache;
    }

    if (getter) {
      // Create a promise to hold the getter promise,
      // because it may throw sync
      const promise = new Promise<V>((resolve, reject) => {
        try {
          resolve(getter());
        } catch (err) {
          reject(err);
        }
      });

      // once stored, we resolve with the getter promise,
      // to allow userland to use the value inmediatly
      await this.set(key, promise, maxAge);
      return promise;
    } else {
      return undefined;
    }
  }

  /**
   * Sets a value in the cache
   *
   * When the value is a promise, and the value rejects, it will be automatically
   * dropped from the cache
   *
   * @returns {Promise.<Boolean>} Success on setting the value on the cache
   */
  async set(key: K, value: Promise<V>, maxAge?: number): Promise<boolean> {
    // catch its error and delete from cache
    Promise.resolve(value).catch(() => this.del(key));

    return this.lru.set(key, value, maxAge);
  }

  /**
   * Deletes a value from the cache
   *
   * @param {String} key
   * @returns {Promise.<*>}
   */
  async del(key: K): Promise<void> {
    return this.lru.del(key);
  }

  /**
   * Clear the cache entirely, throwing away all values.
   *
   * @returns {Promise.<*>}
   */
  async reset(): Promise<void> {
    return this.lru.reset();
  }

  /**
   * Prunes the cache, deleting expired items from the cache
   */
  async prune(): Promise<void> {
    return this.lru.prune();
  }
}

export interface Cache<K, V = unknown> {
  /**
   * Gets a value from the cache. When an optional getter method is provided,
   * it will be called when there is a cache miss to get the value and store
   * it in the cache.
   * When the getter method throws/rejects, it will be propagated down the chain
   *
   * ```js
   *    // Old Way (Sync code)
   *    let value = cache.get(key);
   *    if (!value) {
   *      value = calculateValue();
   *      cache.put(key, value);
   *    }
   *    return value;
   * ```
   *    that becomes
   * ```js
   *    return cache.get(key, calculateValue);
   * ```
   *
   * @param key the cache entry key
   * @param getter the function to call when a value is not found
   *    in the cache. Return promise or a discrete value, that will be
   *    stored in the cache for that key
   * @returns the cache entry
   */
  get(key: K, getter?: () => Promise<V> | V, maxAge?: number): Promise<V>;
  /**
   * Gets a value from the cache.
   *
   * @param key the cache entry key
   * @returns the cache entry
   */
  get(key: K): Promise<V | undefined>;
}
