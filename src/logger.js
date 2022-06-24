const log4js = require("log4js");

const logLevel = process.env.LOG_LEVEL || "debug";
const isProduction = process.env.NODE_ENV === "production";

const scanFileCategory = "scan";
const businessCategory = "business";

log4js.configure({
  appenders: {
    [scanFileCategory]: { type: "file", filename: `log/scan.log` },
    [businessCategory]: { type: "file", filename: `log/bus.log` },
    errorFile: {
      type: "file",
      filename: `log/errors.log`,
    },
    errors: {
      type: "logLevelFilter",
      level: "ERROR",
      appender: "errorFile",
    },
    out: { type: "stdout" },
  },
  categories: {
    default: {
      appenders: [isProduction ? scanFileCategory : "out", "errors"],
      level: logLevel,
    },
    [businessCategory]: {
      appenders: [isProduction ? businessCategory : "out", "errors"],
      level: logLevel,
    },
  },
});

const logger = log4js.getLogger(scanFileCategory);
const busLogger = log4js.getLogger(businessCategory);

module.exports = {
  logger,
  busLogger,
};
