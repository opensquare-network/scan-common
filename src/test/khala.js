const { CHAINS } = require("../consts/chains");
const { setChain, } = require("../env");
const { setProvider, setApi } = require("../chain/api");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const knownOptions = require("@osn/provider-options");

const endpoint = "wss://khala.api.onfinality.io/public-ws";

async function setKhala() {
  jest.setTimeout(3000000);
  setChain(CHAINS.khala);
  const provider = new WsProvider(endpoint, 1000);
  const api = await ApiPromise.create({ provider, ...knownOptions[CHAINS.khala] });
  setProvider(provider);
  setApi(api);
}

module.exports = {
  setKhala,
};
