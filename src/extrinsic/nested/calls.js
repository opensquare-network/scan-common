const {
  Modules,
  ProxyMethods,
  MultisigMethods,
  UtilityMethods,
  SudoMethods,
} = require("../../consts");
const { emptyFn } = require("../../utils/emptyFn");
const { findBlockApi } = require("../../chain");
const { calcMultisigAddress } = require("../../utils/multisig");
const { GenericCall } = require("@polkadot/types");
const { logger } = require("../../logger");
const { encodeDerivedAddress } = require("@polkadot/util-crypto");

let _callHandler;

async function unwrapProxy(call, signer, extrinsicIndexer) {
  const real = call.args[0].toString();
  const innerCall = call.args[2];
  await handleWrappedCall(innerCall, real, extrinsicIndexer);
}

async function unwrapProxyAnnounced(call, signer, extrinsicIndexer) {
  const real = call.args[1].toString();
  const innerCall = call.args[3];
  await handleWrappedCall(innerCall, real, extrinsicIndexer);
}

async function handleMultisig(call, signer, extrinsicIndexer) {
  const blockApi = await findBlockApi(extrinsicIndexer.blockHash);
  const callHex = call.args[3];
  const threshold = call.args[0].toNumber();
  const otherSignatories = call.args[1].toJSON();
  const multisigAddr = calcMultisigAddress(
    [signer, ...otherSignatories],
    threshold,
    blockApi.registry.chainSS58
  );

  let innerCall;
  try {
    innerCall = new GenericCall(blockApi.registry, callHex);
  } catch (e) {
    logger.error(`error when parse multiSig`, extrinsicIndexer);
    return;
  }

  await handleWrappedCall(innerCall, multisigAddr, extrinsicIndexer);
}

async function handleMultisigAsMultiThreshold1(call, signer, extrinsicIndexer) {
  const blockApi = await findBlockApi(extrinsicIndexer.blockHash);
  const callHex = call.args[1];
  const threshold = 1;
  const otherSignatories = call.args[0].toJSON();

  const multisigAddr = calcMultisigAddress(
    [signer, ...otherSignatories],
    threshold,
    blockApi.registry.chainSS58
  );

  let innerCall;
  try {
    innerCall = new GenericCall(blockApi.registry, callHex);
  } catch (e) {
    logger.error(`error when parse multiSig`, extrinsicIndexer);
    return;
  }

  await handleWrappedCall(innerCall, multisigAddr, extrinsicIndexer);
}

async function unwrapBatch(call, signer, extrinsicIndexer) {
  const innerCalls = call.args[0];
  for (let index = 0; index < innerCalls.length; index++) {
    await handleWrappedCall(innerCalls[index], signer, extrinsicIndexer);
  }
}

async function unwrapSudo(call, signer, extrinsicIndexer) {
  const { method } = call;

  const isSudoAs = SudoMethods.sudoAs === method;
  const targetCall = isSudoAs ? call.args[1] : call.args[0];
  const author = isSudoAs ? call.args[0].toString() : signer;
  await handleWrappedCall(targetCall, author, extrinsicIndexer);
}

async function unwrapAsDerivative(call, signer, extrinsicIndexer) {
  const index = call.args[0].toNumber();
  const blockApi = await findBlockApi(extrinsicIndexer.blockHash);
  const derivedAddr = encodeDerivedAddress(signer, index, blockApi.registry.chainSS58);
  const innerCall = call.args[1];
  await handleWrappedCall(innerCall, derivedAddr, extrinsicIndexer);
}

async function handleWrappedCall(call, signer, extrinsicIndexer) {
  const { section, method } = call;
  if (Modules.Proxy === section && ProxyMethods.proxy === method) {
    await unwrapProxy(...arguments);
  } else if (Modules.Proxy === section && "proxyAnnounced" === method) {
    await unwrapProxyAnnounced(...arguments);
  } else if (
    [Modules.Multisig, Modules.Utility].includes(section) &&
    MultisigMethods.asMulti === method
  ) {
    await handleMultisig(...arguments);
  } else if (
    [Modules.Multisig, Modules.Utility].includes(section) &&
    "asMultiThreshold1" === method
  ) {
    await handleMultisigAsMultiThreshold1(...arguments);
  } else if (Modules.Utility === section && [
    UtilityMethods.batch,
    UtilityMethods.batchAll,
    UtilityMethods.forceBatch,
  ].includes(method)) {
    await unwrapBatch(...arguments);
  } else if (Modules.Utility === section && UtilityMethods.asDerivative === method) {
    await unwrapAsDerivative(...arguments);
  } else if (Modules.Sudo === section && [
    SudoMethods.sudo,
    SudoMethods.sudoAs,
  ].includes(method)) {
    await unwrapSudo(...arguments);
  }

  if (_callHandler) {
    await _callHandler(...arguments);
  }
}

async function handlePureNestedCalls(extrinsic, extrinsicIndexer, callHandler = emptyFn) {
  const signer = extrinsic.signer.toString();
  const call = extrinsic.method;

  _callHandler = callHandler;
  await handleWrappedCall(call, signer, extrinsicIndexer);
}

module.exports = {
  handlePureNestedCalls,
}
