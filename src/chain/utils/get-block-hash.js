const { getApi } = require("../api");

async function getBlockHash(height) {
  const api = await getApi();
  return await api.rpc.chain.getBlockHash(height);
}

async function getBlockByHeight(height) {
  const api = await getApi();
  const blockHash = await api.rpc.chain.getBlockHash(height);
  return api.rpc.chain.getBlock(blockHash);
}

module.exports = {
  getBlockHash,
  getBlockByHeight,
};
