const { findBlockApi } = require("../chain");
const { emptyFn } = require("../utils/emptyFn");
const { WrappedEvents } = require("../type/wrappedEvents");
const { isSudoOk, getSudoInnerCallEvents } = require("./utils/sudo");
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
  UtilityEvents,
} = require("../consts");
const { GenericCall } = require("@polkadot/types");

function findBatchItemEventIndex(events = [], from = 0) {
  return events.findIndex(({ event }, index) => {
    return index >= from && event?.section === Modules.Utility && [
      UtilityEvents.ItemCompleted,
      UtilityEvents.BatchInterrupted,
    ].includes(event?.method);
  });
}

function getSlicedEvents(wrappedEvents, start, end, wrapped = true) {
  return new WrappedEvents(
    wrappedEvents.events.slice(start, end),
    wrappedEvents.offset + start,
    wrapped
  );
}

async function collectProxyCalls(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents
) {
  if (!isProxyExecutedOk(wrappedEvents?.events)) {
    return { consumed: 0, entries: [] };
  }

  const innerCallEvents = getProxyInnerCallEvents(wrappedEvents);
  const real = call.args[0].toString();
  const innerCall = call.args[2];
  return await collectWrappedCall(
    blockApi,
    innerCall,
    real,
    extrinsicIndexer,
    innerCallEvents
  );
}

async function collectMultisigCalls(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents
) {
  if (!isMultisigExecutedOk(wrappedEvents.events)) {
    return { consumed: 0, entries: [] };
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
  return await collectWrappedCall(
    blockApi,
    innerCall,
    multisigAddr,
    extrinsicIndexer,
    innerCallEvents
  );
}

async function collectBatchCalls(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents
) {
  const method = call.method;
  const innerCalls = call.args[0];
  const events = wrappedEvents.events || [];
  const entries = [];
  let cursor = 0;
  let interrupted = false;

  for (const innerCall of innerCalls) {
    const start = cursor;
    const childWrappedEvents = getSlicedEvents(
      wrappedEvents,
      start,
      events.length,
      false
    );
    const child = await collectWrappedCall(
      blockApi,
      innerCall,
      signer,
      extrinsicIndexer,
      childWrappedEvents
    );
    const itemEventIndex = findBatchItemEventIndex(events, start + child.consumed);
    const end = itemEventIndex < 0 ? events.length : itemEventIndex;

    if (child.entries.length > 0) {
      child.entries[child.entries.length - 1] = {
        ...child.entries[child.entries.length - 1],
        wrappedEvents: getSlicedEvents(wrappedEvents, start, end, true),
      };
    }

    entries.push(...child.entries);

    if (itemEventIndex < 0) {
      cursor = events.length;
      break;
    }

    interrupted = events[itemEventIndex].event.method === UtilityEvents.BatchInterrupted;
    cursor = itemEventIndex + 1;

    if (interrupted) {
      break;
    }
  }

  if (events[cursor]?.event?.section === Modules.Utility &&
    events[cursor]?.event?.method === UtilityEvents.BatchCompleted) {
    cursor++;
  }

  return {
    consumed: cursor,
    entries: UtilityMethods.batchAll === method && interrupted ? [] : entries,
  };
}

async function collectSudoCalls(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents
) {
  const { method } = call;
  if (!isSudoOk(wrappedEvents.events, method)) {
    return { consumed: 0, entries: [] };
  }

  const isSudoAs = SudoMethods.sudoAs === method;
  const targetCall = isSudoAs ? call.args[1] : call.args[0];
  const author = isSudoAs ? call.args[0].toString() : signer;
  const innerCallEvents = getSudoInnerCallEvents(wrappedEvents, method);
  return await collectWrappedCall(
    blockApi,
    targetCall,
    author,
    extrinsicIndexer,
    innerCallEvents
  );
}

async function collectWrappedCall(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents
) {
  const { section, method } = call;
  let result = { consumed: 0, entries: [] };

  if (Modules.Proxy === section && ProxyMethods.proxy === method) {
    result = await collectProxyCalls(...arguments);
  } else if (
    [Modules.Multisig, Modules.Utility].includes(section) &&
    MultisigMethods.asMulti === method
  ) {
    result = await collectMultisigCalls(...arguments);
  } else if (
    Modules.Utility === section &&
    [
      UtilityMethods.batch,
      UtilityMethods.batchAll,
      UtilityMethods.forceBatch,
    ].includes(method)
  ) {
    result = await collectBatchCalls(...arguments);
  } else if (
    Modules.Sudo === section &&
    [SudoMethods.sudo, SudoMethods.sudoAs].includes(method)
  ) {
    result = await collectSudoCalls(...arguments);
  }

  result.entries.push({ call, signer, extrinsicIndexer, wrappedEvents });
  return result;
}

async function handleWrappedCall(
  blockApi,
  call,
  signer,
  extrinsicIndexer,
  wrappedEvents,
  callHandler
) {
  const { entries } = await collectWrappedCall(
    blockApi,
    call,
    signer,
    extrinsicIndexer,
    wrappedEvents
  );

  if (callHandler) {
    for (const entry of entries) {
      await callHandler(
        entry.call,
        entry.signer,
        entry.extrinsicIndexer,
        entry.wrappedEvents
      );
    }
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
