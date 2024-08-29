const { findBlockApi } = require("../chain");
const { emptyFn } = require("../utils/emptyFn");
const { WrappedEvents } = require("../type/wrappedEvents");
const { isSudoOk, getSudoInnerCallEvents } = require("./utils/sudo");
const { getBatchInnerCallEvents } = require("./utils/batch");
const { findInterrupted } = require("./utils/checkInterrupted");
const {
  isMultisigExecutedOk,
  getMultisigInnerCallEvents,
} = require("./utils/multisig");
const { logger } = require("../logger");
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

async function unwrapProxy(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents,
  callHandler
) {
  if (!isProxyExecutedOk(wrappedEvents?.events)) {
    return;
  }

  const innerCallEvents = getProxyInnerCallEvents(wrappedEvents);
  const real = call.args[0].toString();
  const innerCall = call.args[2];
  await handleWrappedCall(
    blockApi,
    innerCall,
    real,
    extrinsicIndexer,
    innerCallEvents,
    callHandler
  );
}

async function handleMultisig(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents,
  callHandler
) {
  if (!isMultisigExecutedOk(wrappedEvents.events)) {
    return;
  }

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

  const innerCallEvents = getMultisigInnerCallEvents(wrappedEvents);
  await handleWrappedCall(
    blockApi,
    innerCall,
    multisigAddr,
    extrinsicIndexer,
    innerCallEvents,
    callHandler
  );
}

async function unwrapBatch(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents,
  callHandler
) {
  const method = call.method;
  const interruptedEvent = findInterrupted(wrappedEvents);

  if (UtilityMethods.batchAll === method && interruptedEvent) {
    return;
  }

  let endIndex = call.args[0].length;
  if (interruptedEvent) {
    endIndex = interruptedEvent.event?.data[0].toNumber();
  }

  const innerCalls = call.args[0];
  for (let index = 0; index < endIndex; index++) {
    const innerCallEvents = getBatchInnerCallEvents(wrappedEvents, index);
    await handleWrappedCall(
      blockApi,
      innerCalls[index],
      signer,
      extrinsicIndexer,
      innerCallEvents,
      callHandler
    );
  }
}

async function unwrapSudo(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents,
  callHandler
) {
  const { method } = call;
  if (!isSudoOk(wrappedEvents.events, method)) {
    return;
  }

  const isSudoAs = SudoMethods.sudoAs === method;
  const targetCall = isSudoAs ? call.args[1] : call.args[0];
  const author = isSudoAs ? call.args[0].toString() : signer;
  const innerCallEvents = getSudoInnerCallEvents(wrappedEvents, method);
  await handleWrappedCall(
    blockApi,
    targetCall,
    author,
    extrinsicIndexer,
    innerCallEvents,
    callHandler
  );
}

async function handleWrappedCall(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents,
  callHandler
) {
  const { section, method } = call;

  if (Modules.Proxy === section && ProxyMethods.proxy === method) {
    await unwrapProxy(...arguments);
  } else if (
    [Modules.Multisig, Modules.Utility].includes(section) &&
    MultisigMethods.asMulti === method
  ) {
    await handleMultisig(...arguments);
  } else if (
    Modules.Utility === section &&
    [
      UtilityMethods.batch,
      UtilityMethods.batchAll,
      UtilityMethods.forceBatch,
    ].includes(method)
  ) {
    await unwrapBatch(...arguments);
  } else if (
    Modules.Sudo === section &&
    [SudoMethods.sudo, SudoMethods.sudoAs].includes(method)
  ) {
    await unwrapSudo(...arguments);
  }

  if (callHandler) {
    await callHandler(call, signer, extrinsicIndexer, wrappedEvents);
  }
}

async function handleCallsInExtrinsicWithApi(
  blockApi,
  extrinsic,
  events,
  extrinsicIndexer,
  callHandler = emptyFn
) {
  const wrappedEvents = new WrappedEvents(events, 0, false);
  const signer = extrinsic.signer.toString();
  const call = extrinsic.method;

  await handleWrappedCall(
    blockApi,
    call,
    signer,
    extrinsicIndexer,
    wrappedEvents,
    callHandler
  );
}

async function handleCallsInExtrinsic(
  extrinsic,
  events,
  extrinsicIndexer,
  callHandler = emptyFn
) {
  const blockApi = await findBlockApi(extrinsicIndexer.blockHash);
  return await handleCallsInExtrinsicWithApi(
    blockApi,
    extrinsic,
    events,
    extrinsicIndexer,
    callHandler
  );
}

module.exports = {
  handleCallsInExtrinsic,
  handleCallsInExtrinsicWithApi,
};
