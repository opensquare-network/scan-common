const { findBlockApi } = require("./blockApi");
const { getApi } = require("./api");
const { getBlocksByHeights } = require("../mongo/meta");
const { findRegistry } = require("./specs");
const { isUseMetaDb } = require("../env");
const { GenericBlock } = require("@polkadot/types");
const { logger } = require("../logger");
const { extractAuthor } = require("@polkadot/api-derive/type/util");

async function fetchBlocks(heights = [], doFetchAuthor = false) {
  if (isUseMetaDb()) {
    return await fetchBlocksFromDb(heights, doFetchAuthor);
  } else {
    return await fetchBlocksFromNode(heights, doFetchAuthor);
  }
}

async function constructBlockFromDbData(blockInDb, doFetchAuthor = false) {
  const registry = await findRegistry({
    blockHash: blockInDb.blockHash,
    blockHeight: blockInDb.height,
  });
  const block = new GenericBlock(registry, blockInDb.block.block);
  const allEvents = registry.createType(
    "Vec<EventRecord>",
    blockInDb.events,
    true
  );

  return {
    height: blockInDb.height,
    block,
    events: allEvents,
    ...(doFetchAuthor ? { author: blockInDb.author } : {}),
  }
}

async function fetchBlocksFromDb(heights = [], doFetchAuthor = false) {
  const blocksInDb = await getBlocksByHeights(heights);

  const blocks = [];
  for (const blockInDb of blocksInDb) {
    let block
    try {
      block = await constructBlockFromDbData(blockInDb, doFetchAuthor);
    } catch (e) {
      logger.error(`can not construct block from db data at ${ blockInDb.height }`, e?.message);
      block = await fetchOneBlockFromNode(blockInDb.height, doFetchAuthor);
    }

    blocks.push(block)
  }

  return blocks;
}

async function fetchBlocksFromNode(heights = [], doFetchAuthor = false) {
  const allPromises = []
  for (const height of heights) {
    allPromises.push(fetchOneBlockFromNode(height, doFetchAuthor))
  }

  return await Promise.all(allPromises)
}

async function fetchOneBlockFromNode(height, doFetchAuthor = false) {
  const api = await getApi();
  const blockHash = await api.rpc.chain.getBlockHash(height);
  const blockApi = await findBlockApi(blockHash);
  const promises = [
    await api.rpc.chain.getBlock(blockHash),
    await blockApi.query.system.events(),
  ];

  if (blockApi.query.session?.validators && doFetchAuthor) {
    promises.push(
      await blockApi.query.session.validators()
    );
  }

  const [block, events, validators] = await Promise.all(promises);
  let author = null;
  if (validators) {
    const digest = api.registry.createType(
      "Digest",
      block.block.header.digest,
      true
    );

    author = extractAuthor(digest, validators);
  }

  return {
    height,
    block: block.block,
    events,
    author: author?.toString(),
  }
}

module.exports = {
  fetchBlocks,
  fetchOneBlockFromNode,
}
