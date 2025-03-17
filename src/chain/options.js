const knownOptions = require("@osn/provider-options");
const { keccakAsU8a } = require("@polkadot/util-crypto");

const gargantua = {
  typesBundle: {
    spec: {
      gargantua: {
        hasher: keccakAsU8a,
      },
      nexus: {
        hasher: keccakAsU8a,
      },
    },
  },
};

const options = {
  ...knownOptions,
  gargantua,
  nexus: gargantua,
};

module.exports = {
  options,
};
