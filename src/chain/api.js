const { ApiPromise, WsProvider } = require("@polkadot/api");

let provider = null;
let api = null;

function getEndPoint() {
  if (!process.env.WS_ENDPOINT) {
    throw new Error("WS_ENDPOINT not set");
  }

  return process.env.WS_ENDPOINT
}

async function getApi() {
  if (!api) {
    provider = new WsProvider(getEndPoint(), 1000);
    api = await ApiPromise.create({ provider });
    console.log(`Connected to endpoint:`, getEndPoint());
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
