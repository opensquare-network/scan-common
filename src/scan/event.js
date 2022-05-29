const { emptyFn } = require("../utils/emptyFn");

async function handleEvents(events = [], extrinsics = [], blockIndexer, handleEvent = emptyFn) {
  for (let sort = 0; sort < events.length; sort++) {
    const { event, phase } = events[sort];

    let indexer = {
      ...blockIndexer,
      eventIndex: sort,
    }

    let extrinsic, extrinsicIndex;
    if (!phase.isNull) {
      extrinsicIndex = phase.value.toNumber();
      indexer = { ...indexer, extrinsicIndex };
      extrinsic = extrinsics[extrinsicIndex];
    }

    await handleEvent(event, indexer, events, extrinsic);
  }
}

module.exports = {
  handleEvents,
}
