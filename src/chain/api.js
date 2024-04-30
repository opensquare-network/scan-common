const { ApiPromise, WsProvider } = require("@polkadot/api");
const knownOptions = require("@osn/provider-options");
const { currentChain } = require("../env");

let provider = null;
let api = null;

function getEndPoints() {
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) {
    throw new Error("WS_ENDPOINT not set");
  }

  if ((wsEndpoint || "").includes(";")) {
    return wsEndpoint.split(";");
  } else {
    return wsEndpoint;
  }
}

async function getApi() {
  if (!api) {
    const options = knownOptions[currentChain()] || {};
    const endpoints = getEndPoints();
    provider = new WsProvider(endpoints, 1000);
    api = await ApiPromise.create({ provider, ...options });
    console.log(`Connected to endpoint:`, process.env.WS_ENDPOINT);
  }

  if (process.env.NODE_ENV !== 'test') {
    api.on("error", (err) => {
      console.error("api error, will restart:", err);
      process.exit(0);
    });
    api.on("disconnected", () => {
      console.error("api disconnected, will restart.");
      process.exit(0);
    });
  }

  return api;
}

// For test
function setApi(targetApi) {
  api = targetApi;
}

// for test
function setProvider(p) {
  provider = p;
}

// for test
function getProvider() {
  return provider;
}

async function disconnect() {
  if (provider) {
    await provider.disconnect();
  }
}

module.exports = {
  getApi,
  setProvider,
  getProvider,
  disconnect,
  setApi,
};
