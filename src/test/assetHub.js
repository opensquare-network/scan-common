const { setChain, } = require("../env");
const { polkadotAssetHubEndpoint } = require("./constants");
const { setProvider, setApi } = require("../chain/api");
const { ApiPromise, WsProvider } = require("@polkadot/api");

async function setPolkadotAssetHub() {
  jest.setTimeout(3000000);
  setChain("polkadot-asset-hub");
  const provider = new WsProvider(polkadotAssetHubEndpoint, 1000);
  const api = await ApiPromise.create({ provider });
  setProvider(provider);
  setApi(api);
}

module.exports = {
  setPolkadotAssetHub,
};
