const { getCollection } = require("./common");
const { MongoClient } = require("mongodb");

function getDbName() {
  const dbName = process.env.MONGO_DB_SCAN_NAME;
  if (!dbName) {
    throw new Error("MONGO_ACCOUNT_DB_NAME not set");
  }

  return dbName;
}

const mongoUrl = process.env.MONGO_SCAN_URL || "mongodb://127.0.0.1:27017";

let client = null;
let db = null;

let statusCol = null;

async function initScanDb() {
  client = await MongoClient.connect(mongoUrl, {
    useUnifiedTopology: true,
  });

  const dbName = getDbName();
  console.log(`Use scan DB name:`, dbName);

  db = client.db(dbName);
  statusCol = await getCollection(db, "status");

  return db;
}

async function tryInit(col) {
  if (!col) {
    await initScanDb();
  }
}

async function getScanStatusCollection() {
  await tryInit(statusCol);
  return statusCol;
}

const genesisHeight = 1;
const mainScanName = "main-scan-height";

async function getNextScanHeight() {
  const statusCol = await getScanStatusCollection();
  const heightInfo = await statusCol.findOne({ name: mainScanName });

  if (!heightInfo) {
    return genesisHeight;
  } else if (typeof heightInfo.value === "number") {
    return heightInfo.value + 1;
  } else {
    console.error("Scan height value error in DB!");
    process.exit(1);
  }
}

async function updateScanHeight(height) {
  const statusCol = await getScanStatusCollection();
  await statusCol.updateOne(
    { name: mainScanName },
    { $set: { value: height } },
    { upsert: true }
  );
}

module.exports = {
  initScanDb,
  tryInit,
  getScanStatusCollection,
  getNextScanHeight,
  updateScanHeight,
}
