const { logger } = require("../../logger");
const { emptyFn } = require("../../utils");

function isRpcNoResponse(err) {
  if (!err || !err.message || typeof err.message !== 'string') {
    return false
  }

  return err.message.startsWith("No response received from RPC endpoint in");
}

function wrapBlockHandler(handleBlockFn = emptyFn) {
  return async (wrappedBlock) => {
    try {
      await handleBlockFn(wrappedBlock)
    } catch (e) {
      logger.error(`${wrappedBlock.height} scan error`, e);
      if (isRpcNoResponse(e)) {
        // We just exit and restart the process if remote endpoint has no response.
        process.exit(0);
      }

      throw e;
    }
  }
}

module.exports = {
  isRpcNoResponse,
  wrapBlockHandler,
}
