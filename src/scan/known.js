const { logger } = require("../logger");
const { sleep } = require("../utils");
const { emptyFn } = require("../utils");
const { fetchBlocks } = require("../chain");
const { getNextKnownHeights } = require("../mongo/knownHeight");
const last = require("lodash.last");

let count = 0;
async function scanKnownHeights(toScanHeight, updateHeightFn = emptyFn, handleBlockFn = emptyFn) {
  let heights = await getNextKnownHeights(toScanHeight);
  while (heights.length > 0) {
    const blocks = await fetchBlocks(heights);
    for (const block of blocks) {
      try {
        await handleBlockFn(block);
        await updateHeightFn(block.height);
      } catch (e) {
        await sleep(0);
        logger.error(`Error with block scan ${ block.height }`, e);
      }

      logger.info(`${ block.height } scan finished! - known height scan`)
    }

    const lastHeight = last(blocks || [])?.height
    count++
    if (count % 10 === 0) {
      console.log(`${ lastHeight } restart process in case of memory leak`);
      process.exit(0);
    }

    heights = await getNextKnownHeights(lastHeight + 1);
  }
}

module.exports = {
  scanKnownHeights,
}
