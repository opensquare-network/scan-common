const { getApi } = require("./api");

let latestHeight = null;
let latestUnFinalizedHeight = null;

async function subscribeChainHeight() {
  const api = await getApi();

  await new Promise((resolve) => {
    api.rpc.chain.subscribeFinalizedHeads((header) => {
      latestHeight = header.number.toNumber();
      resolve();
    });
  });
}

// latest un-finalized block height
async function subscribeLatestHeight() {
  const api = await getApi();

  await new Promise((resolve) => {
    api.rpc.chain.subscribeNewHeads((header) => {
      latestUnFinalizedHeight = header.number.toNumber();
      resolve();
    });
  });
}

function getLatestUnFinalizedHeight() {
  return latestUnFinalizedHeight;
}

function getLatestFinalizedHeight() {
  return latestHeight;
}

function getLatestHeight() {
  return latestHeight;
}

module.exports = {
  subscribeChainHeight,
  subscribeFinalizedHeight: subscribeChainHeight,
  subscribeLatestHeight,
  getLatestUnFinalizedHeight,
  getLatestFinalizedHeight,
  getLatestHeight,
};
