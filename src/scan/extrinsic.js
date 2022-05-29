const { handleCallsInExtrinsic } = require("../extrinsic/call");
const { emptyFn } = require("../utils/emptyFn");
const { extractExtrinsicEvents, isExtrinsicSuccess } = require("../utils");

async function handleExtrinsics(extrinsics = [], allEvents = [], blockIndexer, handleCall = emptyFn) {
  let index = 0;
  for (const extrinsic of extrinsics) {
    const events = extractExtrinsicEvents(allEvents, index);
    if (!isExtrinsicSuccess(events)) {
      continue;
    }

    const extrinsicIndexer = { ...blockIndexer, extrinsicIndex: index++ };
    await handleCallsInExtrinsic(extrinsic, events, extrinsicIndexer, handleCall)
  }
}

module.exports = {
  handleExtrinsics,
}
