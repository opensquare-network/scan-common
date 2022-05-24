module.exports = {
  ...require("./specs"),
  ...require("./api"),
  ...require("./blockApi"),
  ...require("./fetchBlocks"),
  ...require("./utils/extractBlockTime"),
  ...require("./utils/getBlockIndexer"),
  ...require("./latestHead"),
}
