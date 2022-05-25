const {
  Modules,
  ProxyMethods,
  MultisigMethods,
  UtilityMethods,
} = require("../../consts");
const { emptyFn } = require("../../utils/emptyFn");
const { GenericCall } = require("@polkadot/types");

function findTargetCallFromProxy(proxyCall, checkFn) {
  const innerCall = proxyCall.args[2];
  return findTargetCall(innerCall, checkFn);
}

function findTargetCallFromMultisig(multisigCall, checkFn) {
  const callHex = multisigCall.args[3];
  const innerCall = new GenericCall(multisigCall.registry, callHex);
  return findTargetCall(innerCall, checkFn);
}

function findTargetCallFromBatch(batchCall, checkFn) {
  for (const innerCall of batchCall.args[0]) {
    const call = findTargetCall(innerCall, checkFn);
    if (call) {
      return call;
    }
  }

  return null;
}

function findTargetCall(call, checkFn = emptyFn) {
  if (checkFn(call)) {
    return call
  }

  const { section, method } = call;

  if (Modules.Proxy === section && ProxyMethods.proxy === method) {
    return findTargetCallFromProxy(...arguments);
  } else if (Modules.Multisig === section && MultisigMethods.asMulti === method) {
    return findTargetCallFromMultisig(...arguments);
  } else if (Modules.Utility === section && [UtilityMethods.batch, UtilityMethods.batchAll].includes(method)) {
    return findTargetCallFromBatch(...arguments);
  }

  return null;
}

module.exports = {
  findTargetCall,
}
