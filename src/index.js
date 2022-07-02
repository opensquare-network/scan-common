const chain = require("./chain");
const utils = require("./utils");
const env = require("./env");
const scan = require("./scan");
const call = require("./extrinsic/call");

module.exports = {
  ...require("./extrinsic/call/find"),
  ...require("./extrinsic/call"),
  ...require("./logger"),
  chain,
  utils,
  env,
  consts: require("./consts"),
  test: require("./test"),
  scan,
  call,
}
