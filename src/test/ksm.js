const { CHAINS } = require("../consts/chains");
const { setChain } = require("../env");
const { setProvider, setApi } = require("../chain/api");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { kusamaEndpoint } = require("./constants");

async function setKusama() {
  const provider = new WsProvider(kusamaEndpoint, 1000);
  const api = await ApiPromise.create({ provider });
  setProvider(provider);
  setApi(api);
  setChain(CHAINS.KUSAMA);
}

module.exports = {
  setKusama,
};
