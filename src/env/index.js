const { CHAINS } = require("../consts/chains");
const scanStep = parseInt(process.env.SCAN_STEP) || 100;
const useKnownHeights = !!process.env.USE_KNOWN_HEIGHTS;
const useMetaDb = parseInt(process.env.USE_META) === 1;

let chain = null;

function setChain(targetChain) {
  chain = targetChain;
}

function currentChain() {
  if (chain) {
    return chain;
  }

  if ([
    CHAINS.POLKADOT,
    CHAINS.KUSAMA,
  ].includes(process.env.CHAIN)) {
    setChain(process.env.CHAIN);
    return process.env.CHAIN;
  }

  throw new Error(`Unknown chain ${ process.env.CHAIN }`);
}

function getScanStep() {
  return scanStep;
}

function firstScanKnowHeights() {
  return useKnownHeights;
}

function isUseMetaDb() {
  return useMetaDb;
}

module.exports = {
  currentChain,
  getScanStep,
  setChain,
  firstScanKnowHeights,
  isUseMetaDb,
};
