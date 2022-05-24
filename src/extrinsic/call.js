const { emptyFn } = require("../utils/emptyFn");
const { WrappedEvents } = require("../type/wrappedEvents");
const { isSudoOk, getSudoInnerCallEvents } = require("./utils/sudo");
const { getBatchInnerCallEvents } = require("./utils/batch");
const { findInterrupted } = require("./utils/checkInterrupted");
const { isMultisigExecutedOk, getMultisigInnerCallEvents } = require("./utils/multisig");
const { logger } = require("../logger");
const { findRegistry } = require("../chain/specs");
const { calcMultisigAddress } = require("../utils/multisig");
const { getProxyInnerCallEvents } = require("./utils/getProxyCallEvents");
const { isProxyExecutedOk } = require("./utils/isProxyExecutedOk");
const {
  Modules,
  ProxyMethods,
  MultisigMethods,
  UtilityMethods,
  SudoMethods,
} = require("../consts");
const { GenericCall } = require("@polkadot/types");

let _callHandler;

async function unwrapProxy(call, signer, extrinsicIndexer, wrappedEvents) {
  if (!isProxyExecutedOk(wrappedEvents?.events)) {
    return
  }

  const innerCallEvents = getProxyInnerCallEvents(wrappedEvents);
  const real = call.args[0].toJSON();
  const innerCall = call.args[2];
  await handleWrappedCall(innerCall, real, extrinsicIndexer, innerCallEvents);
}

async function handleMultisig(call, signer, extrinsicIndexer, wrappedEvents) {
  if (!isMultisigExecutedOk(wrappedEvents.events)) {
    return
  }

  const registry = await findRegistry(extrinsicIndexer);
  const callHex = call.args[3];
  const threshold = call.args[0].toNumber();
  const otherSignatories = call.args[1].toJSON();
  const multisigAddr = calcMultisigAddress(
    [signer, ...otherSignatories],
    threshold,
    registry.chainSS58
  );

  let innerCall;
  try {
    innerCall = new GenericCall(registry, callHex);
  } catch (e) {
    logger.error(`error when parse multiSig`, extrinsicIndexer);
    return;
  }

  const innerCallEvents = getMultisigInnerCallEvents(wrappedEvents);
  await handleWrappedCall(innerCall, multisigAddr, extrinsicIndexer, innerCallEvents);
}

async function unwrapBatch(call, signer, extrinsicIndexer, wrappedEvents) {
  const method = call.method;
  const interruptedEvent = findInterrupted(wrappedEvents);

  if (UtilityMethods.batchAll === method && interruptedEvent) {
    return
  }

  let endIndex = call.args[0].length;
  if (interruptedEvent) {
    endIndex = interruptedEvent.event?.data[0].toNumber();
  }

  const innerCalls = call.args[0];
  for (let index = 0; index < endIndex; index++) {
    const innerCallEvents = getBatchInnerCallEvents(wrappedEvents, index);
    await handleWrappedCall(innerCalls[index], signer, extrinsicIndexer, innerCallEvents);
  }
}

async function unwrapSudo(call, signer, extrinsicIndexer, wrappedEvents) {
  const { method } = call;
  if (!isSudoOk(wrappedEvents.events, method)) {
    return
  }

  const innerCallEvents = getSudoInnerCallEvents(wrappedEvents, method);
  await handleWrappedCall(call.args[0], signer, extrinsicIndexer, innerCallEvents);
}

async function handleWrappedCall(call, signer, extrinsicIndexer, wrappedEvents) {
  const { section, method } = call;

  if (Modules.Proxy === section && ProxyMethods.proxy === method) {
    await unwrapProxy(...arguments);
  } else if (
    Modules.Multisig === section &&
    MultisigMethods.asMulti === method
  ) {
    await handleMultisig(...arguments);
  } else if (Modules.Utility === section && [
    UtilityMethods.batch,
    UtilityMethods.batchAll,
  ].includes(method)) {
    await unwrapBatch(...arguments);
  } else if (Modules.Sudo === section && [
    SudoMethods.sudo,
    SudoMethods.sudoAs,
  ].includes(method)) {
    await unwrapSudo(...arguments);
  }

  if (_callHandler) {
    _callHandler(...arguments);
  }
}

async function handleCallsInExtrinsic(extrinsic, events, extrinsicIndexer, callHandler = emptyFn) {
  const wrappedEvents = new WrappedEvents(events, 0, false);
  const signer = extrinsic.signer.toString();
  const call = extrinsic.method;

  _callHandler = callHandler;
  await handleWrappedCall(call, signer, extrinsicIndexer, wrappedEvents);
}

module.exports = {
  handleCallsInExtrinsic,
}
