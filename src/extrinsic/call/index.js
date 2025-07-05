const { normalizeCall } = require("./normalize");
const { findTargetCall } = require("./find");

module.exports = {
  normalizeCall,
  findTargetCall,
  ...require("./leaf"),
}
