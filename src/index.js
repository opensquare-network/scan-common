const chain = require("./chain");
const utils = require("./utils");
const env = require("./env");
const scan = require("./scan");
const call = require("./extrinsic/call/index");

module.exports = {
  ...require("./extrinsic/call/find"),
  ...call,
  ...require("./logger"),
  ...require("./extrinsic/callInExtrinsic"),
  chain,
  utils,
  env,
  consts: require("./consts"),
  test: require("./test"),
  scan,
  call,
}
