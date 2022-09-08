const { getCollection } = require("./common");
const { MongoClient } = require("mongodb");

let client = null;
let db = null;
let statusCol = null;

async function initScanDb(mongoUrl, dbName) {
  client = await MongoClient.connect(mongoUrl, {
    useUnifiedTopology: true,
  });

  console.log(`Use scan DB name:`, dbName);

  db = client.db(dbName);
  statusCol = await getCollection(db, "status");

  return db;
}

function checkInit(col) {
  if (!col) {
    throw new Error(`Database is not initialized`)
  }
}

async function getScanStatusCollection() {
  await checkInit(statusCol);
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
  checkInit,
  getScanStatusCollection,
  getNextScanHeight,
  updateScanHeight,
}
