const { findBlockApi } = require("./blockApi");
const { getApi, getProvider } = require("./api");
const { getBlocksByHeights } = require("../mongo/meta");
const { findRegistry } = require("./specs");
const { isUseMetaDb } = require("../env");
const { GenericBlock } = require("@polkadot/types");
const { logger } = require("../logger");
const { extractAuthor } = require("@polkadot/api-derive/type/util");
const { decodeExtrinsic } = require("./decodeExtrinsic");

async function fetchBlocks(heights = [], doFetchAuthor = false) {
  if (isUseMetaDb()) {
    return await fetchBlocksFromDb(heights, doFetchAuthor);
  } else {
    return await fetchBlocksFromNode(heights, doFetchAuthor);
  }
}

async function fetchBlocksInLimitedSeconds(heights = [], doFetchAuthor = false, limitedSeconds = 0) {
  if (limitedSeconds <= 0) {
    return await fetchBlocks(heights, doFetchAuthor);
  }

  const fetchPromise = fetchBlocks(heights, doFetchAuthor);
  const timePromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("Fetch blocks request timeout")), 1000 * limitedSeconds);
  });
  return Promise.race([fetchPromise, timePromise]);
}

// Build a Block from an undecoded block ({ header, extrinsics }), decoding every
// extrinsic on its own so that general transactions are handled correctly.
function constructBlockFromRaw(registry, rawBlock) {
  const header = registry.createType("Header", rawBlock.header);
  const extrinsics = (rawBlock.extrinsics || []).map((extrinsic) =>
    decodeExtrinsic(registry, extrinsic),
  );

  return registry.createType("Block", { header, extrinsics });
}

// `api.rpc.chain.getBlock` decodes the whole block in one go and throws when a single
// extrinsic can not be decoded. Fetch the raw block instead and decode it ourselves.
async function fetchBlock(api, blockApi, blockHash) {
  const provider = getProvider();
  if (provider) {
    try {
      const rawBlock = await provider.send("chain_getBlock", [blockHash.toHex()]);
      return constructBlockFromRaw(blockApi.registry, rawBlock.block);
    } catch (e) {
      logger.warn(
        `Can not construct block ${ blockHash.toHex() } from raw data, fallback to rpc`,
        e?.message,
      );
    }
  }

  return (await api.rpc.chain.getBlock(blockHash)).block;
}

async function constructBlockFromDbData(blockInDb, doFetchAuthor = false) {
  const registry = await findRegistry({
    blockHash: blockInDb.blockHash,
    blockHeight: blockInDb.height,
  });

  let block;
  try {
    block = new GenericBlock(registry, blockInDb.block.block);
  } catch (e) {
    logger.warn(`Can not decode block in db at ${ blockInDb.height }, decode by extrinsic`);
    block = constructBlockFromRaw(registry, blockInDb.block.block);
  }

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
    await fetchBlock(api, blockApi, blockHash),
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
      block.header.digest,
      true
    );

    author = extractAuthor(digest, validators);
  }

  return {
    height,
    block,
    events,
    author: author?.toString(),
  }
}

module.exports = {
  fetchBlocks,
  fetchOneBlockFromNode,
  fetchBlocksInLimitedSeconds,
}
