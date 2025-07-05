const {
  Modules, ProxyMethods, MultisigMethods, UtilityMethods, SudoMethods,
} = require("../../consts");
const { calcMultisigAddress } = require("../../utils/multisig");
const { findBlockApi } = require("../../chain");
const { GenericCall } = require("@polkadot/types");
const { logger } = require("../../logger");
const { encodeDerivedAddress } = require("@polkadot/util-crypto");

function findLeafFromProxy(proxyCall, indexer) {
  const real = proxyCall.args[0].toString();
  const innerCall = proxyCall.args[2];
  return findLeafOriginAndCalls(innerCall, real, indexer);
}

function findLeafFromProxyAnnounced(call, indexer) {
  const real = call.args[1].toString();
  const innerCall = call.args[3];
  return findLeafOriginAndCalls(innerCall, real, indexer);
}

async function _findLeafFromMultiCommon(hexOrCall, allSignatories, threshold, indexer) {
  const blockApi = await findBlockApi(indexer.blockHash);
  const multisigAddr = calcMultisigAddress(allSignatories, threshold, blockApi.registry.chainSS58);

  let innerCall;
  if (hexOrCall.section) {
    innerCall = hexOrCall;
  } else {
    try {
      innerCall = new GenericCall(blockApi.registry, hexOrCall);
    } catch (e) {
      logger.error(`error when parse multiSig`, indexer.blockHeight);
      return [];
    }
  }

  return await findLeafOriginAndCalls(innerCall, multisigAddr, indexer);
}

async function findLeafFromAsMulti(call, origin, indexer) {
  const threshold = call.args[0].toNumber();
  const hexOrCall = call.args[3];
  const otherSignatories = call.args[1].toJSON();
  return _findLeafFromMultiCommon(hexOrCall, [origin, ...otherSignatories], threshold, indexer);
}

async function findLeafFromAsMultiThreshold1(call, origin, indexer) {
  const hexOrCall = call.args[1];
  const otherSignatories = call.args[0].toJSON();
  return _findLeafFromMultiCommon(hexOrCall, [origin, ...otherSignatories], 1, indexer);
}

async function findLeafCallsFromBatch(call, origin, indexer) {
  const targetCalls = [];
  const innerCalls = call.args[0];
  for (const innerCall of innerCalls) {
    const calls = await findLeafOriginAndCalls(innerCall, origin, indexer);
    targetCalls.push(...calls);
  }
  return targetCalls;
}

async function findLeafFromAsDerivative(call, origin, indexer) {
  const index = call.args[0].toNumber();
  const blockApi = await findBlockApi(indexer.blockHash);
  const derivedAddr = encodeDerivedAddress(origin, index, blockApi.registry.chainSS58);
  const innerCall = call.args[1];
  return await findLeafOriginAndCalls(innerCall, derivedAddr, indexer);
}

async function findLeafFromSudo(call, origin, indexer) {
  const innerCall = call.args[0];
  return await findLeafOriginAndCalls(innerCall, origin, indexer)
}

async function findLeafFromSudoAs(call, indexer) {
  const who = call.args[0].toString();
  const innerCall = call.args[1];
  return await findLeafOriginAndCalls(innerCall, who, indexer);
}

async function findLeafOriginAndCalls(call, origin, indexer) {
  const { section, method } = call;
  if (Modules.Proxy === section && ProxyMethods.proxy === method) {
    return findLeafFromProxy(call, indexer);
  } else if (Modules.Proxy === section && ProxyMethods.proxyAnnounced === method) {
    return findLeafFromProxyAnnounced(call, indexer);
  } else if ([Modules.Multisig, Modules.Utility].includes(section) && MultisigMethods.asMulti === method) {
    return await findLeafFromAsMulti(call, origin, indexer);
  } else if ([Modules.Multisig, Modules.Utility].includes(section) && MultisigMethods.asMultiThreshold1 === method) {
    return await findLeafFromAsMultiThreshold1(call, origin, indexer);
  } else if (Modules.Utility === section && [
    UtilityMethods.batch,
    UtilityMethods.batchAll,
    UtilityMethods.forceBatch,
  ].includes(method)) {
    return await findLeafCallsFromBatch(call, origin, indexer);
  } else if (Modules.Utility === section && UtilityMethods.asDerivative === method) {
    return await findLeafFromAsDerivative(call, origin, indexer);
  } else if (Modules.Sudo === section && SudoMethods.sudo === method) {
    return await findLeafFromSudo(call, origin, indexer);
  } else if (Modules.Sudo === section && SudoMethods.sudoAs === method) {
    return await findLeafFromSudoAs(call, indexer);
  } else {
    return [{ origin, call }];
  }
}

module.exports = {
  findLeafOriginAndCalls,
}
