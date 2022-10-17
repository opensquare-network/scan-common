const scanStep = parseInt(process.env.SCAN_STEP) || 100;
const useKnownHeights = parseInt(process.env.USE_KNOWN_HEIGHTS) === 1;
const useMetaDb = parseInt(process.env.USE_META) === 1;

let chain = null;

function setChain(targetChain) {
  chain = targetChain;
}

function currentChain() {
  if (chain) {
    return chain;
  }

  if (!process.env.CHAIN) {
    throw new Error(`process.env.CHAIN not set`);
  }

  setChain(process.env.CHAIN);
  return chain;
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

function getEnvOrThrow(envName) {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`Environment variable ${ envName } not set`);
  }

  return value
}


module.exports = {
  currentChain,
  getScanStep,
  setChain,
  firstScanKnowHeights,
  isUseMetaDb,
  getEnvOrThrow,
};
