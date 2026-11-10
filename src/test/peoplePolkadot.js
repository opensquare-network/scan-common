const { setChain } = require("../env");
const { polkadotPeopleEndpoint } = require("./constants");
const { setProvider, setApi } = require("../chain/api");
const { ApiPromise, WsProvider } = require("@polkadot/api");

async function setPolkadotPeople() {
  jest.setTimeout(3000000);
  setChain("people-polkadot");
  const provider = new WsProvider(polkadotPeopleEndpoint, 1000);
  const api = await ApiPromise.create({ provider });
  setProvider(provider);
  setApi(api);
}

module.exports = {
  setPolkadotPeople,
};
