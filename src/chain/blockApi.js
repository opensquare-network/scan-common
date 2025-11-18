const { getApi } = require("./api");

// LRU Cache implementation to prevent memory leak
// The original implementation used an unbounded cache that would grow indefinitely,
// causing out-of-memory errors in long-running processes.
// This implementation limits the cache size and evicts least recently used entries.

// Maximum number of block APIs to cache (configurable via env var)
// Default: 100 entries
// Lower values = less memory usage, more API recreations
// Higher values = more memory usage, fewer API recreations
// Setting BLOCK_API_CACHE_SIZE=0 effectively disables the cache (no entries cached)
// Negative values are treated as 0 (cache disabled)
const MAX_CACHE_SIZE = Math.max(0, parseInt(process.env.BLOCK_API_CACHE_SIZE || '100'));

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
      // Remove the evicted block API from cache
      // Note: We don't call disconnect() because blockApi instances share
      // the same underlying RPC provider/connection managed by the main api instance.
      // Removing the reference allows garbage collection to clean up the object.
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
  // Clear all cached block API references
  // Note: We don't call disconnect() because blockApi instances share
  // the same underlying RPC provider/connection managed by the main api instance.
  // Clearing references allows garbage collection to clean up the objects.
  blockApiMap.clear();
  accessOrder.clear();
  accessCounter = 0;
}

// Export function to get cache stats (useful for monitoring)
function getBlockApiCacheStats() {
  return {
    size: blockApiMap.size,
    maxSize: MAX_CACHE_SIZE,
    usagePercent: MAX_CACHE_SIZE > 0 
      ? ((blockApiMap.size / MAX_CACHE_SIZE) * 100).toFixed(1)
      : '0.0'
  };
}

module.exports = {
  findBlockApi,
  clearBlockApiCache,
  getBlockApiCacheStats,
}
