const { GenericExtrinsic } = require("@polkadot/types");
const { compactFromU8a, hexToU8a, isHex, isU8a } = require("@polkadot/util");
const { options: allOptions } = require("./options");
const { currentChain } = require("../env");

const TYPE_MASK = 0b11000000;
const GENERAL_PREAMBLE = 0b01000000;

// polkadot.js ships no type definition for these transaction extensions, so it treats
// them as zero-length and the positional decode of a general transaction desyncs.
// The types below are the ones the chain metadata declares for them
// (extrinsic.transactionExtensions[].type).
const MISSING_EXTENSION_TYPES = {
  AuthorizeCall: { extrinsic: {}, payload: {} },
  EthSetOrigin: { extrinsic: {}, payload: {} },
  StorageWeightReclaim: { extrinsic: {}, payload: {} },
  UnitTransactionExtension: { extrinsic: {}, payload: {} },
  VerifyMultiSignature: {
    extrinsic: { verifyMultiSignature: "PalletVerifySignatureExtensionVerifySignature" },
    payload: {},
  },
  AsPgas: {
    extrinsic: { asPgas: "Option<IndivPalletPgasExtensionAsPgasInfo>" },
    payload: {},
  },
  AsDotnsGateway: {
    extrinsic: { asDotnsGateway: "Option<IndivPalletDotnsGatewayExtensionAsDotnsGatewayInfo>" },
    payload: {},
  },
  AsPerson: {
    extrinsic: { asPerson: "Option<IndivPalletPeopleExtensionAsPersonInfo>" },
    payload: {},
  },
  PeopleLiteAuth: {
    extrinsic: { peopleLiteAuth: "Option<IndivPalletPeopleLiteExtensionPeopleLiteAuthData>" },
    payload: {},
  },
  AsMember: {
    extrinsic: { asMember: "Option<IndivPalletMembersExtensionAsMemberInfo>" },
    payload: {},
  },
  AsCoinage: {
    extrinsic: { asCoinage: "Option<IndivPalletCoinageExtensionAsCoinageInfo>" },
    payload: {},
  },
  AsResources: {
    extrinsic: { asResources: "Option<IndivPalletResourcesExtensionAsResourcesInfo>" },
    payload: {},
  },
  RestrictOrigins: { extrinsic: { restrictOrigins: "bool" }, payload: {} },
};

// The extensions passed to ApiPromise.create, which polkadot.js keeps on the registry.
// They need to be handed back when we restore the registry after decoding.
function chainUserExtensions() {
  try {
    return (allOptions[currentChain()] || {}).signedExtensions;
  } catch (e) {
    return undefined;
  }
}

function extrinsicMetadata(registry) {
  return registry.metadata && registry.metadata.extrinsic;
}

// The list polkadot.js itself derives from the metadata, i.e. the registry default.
function defaultExtensionList(registry) {
  const metadata = extrinsicMetadata(registry);
  const extensions = metadata && metadata.transactionExtensions;
  return extensions ? extensions.map((s) => s.identifier.toString()) : null;
}

// Extension identifiers a general transaction was encoded with, in encoding order.
// Only metadata v16 chains carry transactionExtensionsByVersion.
function extensionOrderForVersion(registry, version) {
  const metadata = extrinsicMetadata(registry);
  const byVersion = metadata && metadata.transactionExtensionsByVersion;
  if (!byVersion) {
    return null;
  }

  const map = byVersion.toJSON ? byVersion.toJSON() : byVersion;
  const indices = map[`${version}`];
  if (!indices) {
    return null;
  }

  const all = defaultExtensionList(registry);
  if (!all) {
    return null;
  }

  return indices.map((i) => all[Number(i)]);
}

// Transaction extension version of a general transaction, read from the byte right
// after the preamble. Returns null when the extrinsic is not a general transaction.
function generalExtrinsicVersion(u8a) {
  if (!u8a || !u8a.length) {
    return null;
  }

  let offset;
  try {
    [offset] = compactFromU8a(u8a);
  } catch (e) {
    return null;
  }

  if (offset >= u8a.length || (u8a[offset] & TYPE_MASK) !== GENERAL_PREAMBLE) {
    return null;
  }

  const version = u8a[offset + 1];
  return version === undefined ? null : version;
}

/**
 * Decode one extrinsic the way `new GenericExtrinsic(registry, value)` does, except
 * that a general transaction (extrinsic format v5, preamble 0b01) is decoded with the
 * transaction extension set it was actually encoded with.
 *
 * polkadot.js always builds the GeneralExtrinsic field list from the flat metadata
 * extension list and hardcodes transaction extension version 0, so transactions
 * carrying a different extension version desync and throw, e.g.
 * "Invalid data passed to Mortal era".
 */
function decodeExtrinsic(registry, value) {
  const u8a = isU8a(value) ? value : isHex(value) ? hexToU8a(value) : null;
  const version = u8a ? generalExtrinsicVersion(u8a) : null;
  const order = version === null ? null : extensionOrderForVersion(registry, version);
  if (!order || typeof registry.setSignedExtensions !== "function") {
    return new GenericExtrinsic(registry, value);
  }

  // GeneralExtrinsic reads the extension set off the registry, so swap in the right
  // one for the duration of this decode and restore it right after.
  const saved = defaultExtensionList(registry);
  registry.setSignedExtensions(order, MISSING_EXTENSION_TYPES, true);
  try {
    return new GenericExtrinsic(registry, value);
  } finally {
    if (saved) {
      registry.setSignedExtensions(saved, chainUserExtensions(), true);
    }
  }
}

/**
 * The origin account of an extrinsic, as an address.
 *
 * polkadot.js throws when the `signer` of a general transaction is read: those carry no
 * top-level signature, their origin is established by the transaction extensions instead.
 * Take the account from the extension holding the signature, e.g. Polkadot AssetHub's
 * `VerifyMultiSignature::Signed { signature, account }`.
 *
 * Returns undefined when the origin can not be told from the extensions.
 */
function getExtrinsicSigner(extrinsic) {
  if (!extrinsic) {
    return undefined;
  }

  if (typeof extrinsic.isGeneral !== "function" || !extrinsic.isGeneral()) {
    return extrinsic.signer.toString();
  }

  const inner = extrinsic.inner;
  const keys = inner && inner.defKeys;
  if (!keys) {
    return undefined;
  }

  for (const key of keys) {
    if (key === "method" || key === "transactionExtensionVersion") {
      continue;
    }

    let value;
    try {
      value = inner.get(key);
    } catch (e) {
      continue;
    }

    const signed = value && value.isSigned ? value.asSigned : undefined;
    if (signed && signed.account) {
      return signed.account.toString();
    }
  }

  return undefined;
}

module.exports = {
  decodeExtrinsic,
  extensionOrderForVersion,
  getExtrinsicSigner,
};
