const { getApi } = require("./api");

// LRU Cache implementation to prevent memory leak
// The original implementation used an unbounded cache that would grow indefinitely,
// causing out-of-memory errors in long-running processes.
// This implementation limits the cache size and evicts least recently used entries.

// Maximum number of block APIs to cache (configurable via env var)
// Default: 100 entries
// Lower values = less memory usage, more API recreations
// Higher values = more memory usage, fewer API recreations
const MAX_CACHE_SIZE = parseInt(process.env.BLOCK_API_CACHE_SIZE || '100');

// Use Map to maintain insertion order for LRU eviction
let blockApiMap = new Map();
let accessOrder = new Map(); // Track access order for LRU
let accessCounter = 0;

function setBlockApi(blockHash, api) {
  // If cache is full, evict least recently used entry
  if (blockApiMap.size >= MAX_CACHE_SIZE && !blockApiMap.has(blockHash)) {
    // Find least recently used entry
    let lruHash = null;
    let lruAccess = Infinity;
    
    for (const [hash, accessTime] of accessOrder.entries()) {
      if (accessTime < lruAccess) {
        lruAccess = accessTime;
        lruHash = hash;
      }
    }
    
    if (lruHash) {
      // Clean up the evicted block API
      const evictedApi = blockApiMap.get(lruHash);
      if (evictedApi && typeof evictedApi.disconnect === 'function') {
        try {
          evictedApi.disconnect();
        } catch (err) {
          // Ignore disconnect errors during cleanup
        }
      }
      blockApiMap.delete(lruHash);
      accessOrder.delete(lruHash);
    }
  }
  
  blockApiMap.set(blockHash, api);
  accessCounter++;
  accessOrder.set(blockHash, accessCounter);
}

async function findBlockApi(blockHash) {
  const maybe = blockApiMap.get(blockHash);
  if (maybe) {
    // Update access order (mark as recently used)
    accessCounter++;
    accessOrder.set(blockHash, accessCounter);
    return maybe;
  }

  const api = await getApi();
  const blockApi = await api.at(blockHash);

  setBlockApi(blockHash, blockApi);
  return blockApi;
}

// Export function to clear cache (useful for testing or manual cleanup)
function clearBlockApiCache() {
  // Disconnect all cached APIs
  for (const [hash, cachedApi] of blockApiMap.entries()) {
    if (cachedApi && typeof cachedApi.disconnect === 'function') {
      try {
        cachedApi.disconnect();
      } catch (err) {
        // Ignore disconnect errors
      }
    }
  }
  blockApiMap.clear();
  accessOrder.clear();
  accessCounter = 0;
}

// Export function to get cache stats (useful for monitoring)
function getBlockApiCacheStats() {
  return {
    size: blockApiMap.size,
    maxSize: MAX_CACHE_SIZE,
    usagePercent: ((blockApiMap.size / MAX_CACHE_SIZE) * 100).toFixed(1)
  };
}

module.exports = {
  findBlockApi,
  clearBlockApiCache,
  getBlockApiCacheStats,
}
