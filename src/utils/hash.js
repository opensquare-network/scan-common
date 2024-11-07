function getFixedBlockIndexer(indexer, block, chain) {
  if (!["gargantua", "nexus"].includes(chain)) {
    return indexer;
  }

  const headerU8a = block.header.toU8a();
  const blockHash = keccakAsHex(headerU8a, 256);
  return {
    ...indexer,
    blockHash,
  };
}

module.exports = {
  getFixedBlockIndexer,
};
