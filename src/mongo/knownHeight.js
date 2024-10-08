const { getScanStep } = require("../env");
const { MongoClient } = require("mongodb");

function getDbName() {
  const dbName = process.env.MONGO_DB_KNOWN_HEIGHTS_NAME
  if (!dbName) {
    throw new Error("no MONGO_DB_KNOWN_HEIGHTS_NAME set")
  }

  return dbName;
}

const heightCollectionName = "height";

let client = null;
let db = null;

const mongoUrl = process.env.MONGO_DB_KNOWN_HEIGHTS_URL || "mongodb://127.0.0.1:27017";

let heightCol = null;

async function initDb() {
  client = await MongoClient.connect(mongoUrl);

  db = client.db(getDbName());
  heightCol = db.collection(heightCollectionName);

  await _createIndexes();
}

async function _createIndexes() {
  if (!db) {
    console.error("Please call initDb first");
    process.exit(1);
  }

  await heightCol.createIndex({ height: 1 }, { unique: true });
}

async function tryInit(col) {
  if (!col) {
    await initDb();
  }
}

async function getHeightCollection() {
  await tryInit(heightCol);
  return heightCol;
}

async function saveKnownHeights(heights = []) {
  if (heights.length <= 0) {
    return
  }

  const col = await getHeightCollection();
  const bulk = col.initializeUnorderedBulkOp();
  for (const height of heights) {
    bulk.find({ height }).upsert().updateOne({ $set: { height } });
  }

  await bulk.execute();
}

async function getNextKnownHeights(beginHeight) {
  const step = getScanStep();
  const col = await getHeightCollection()
  const records = await col.find({
    height: { $gte: beginHeight },
  }).sort({ height: 1 }).limit(step).toArray();

  const heights = (records || []).map(item => item.height);
  return [...new Set(heights)].sort((a, b) => a - b);
}

async function closeKnownClient() {
  await client.close()
}

async function getKnownHeightDb() {
  if (!db) {
    await initDb();
  }

  return db;
}

module.exports = {
  getKnownHeightDb,
  getKnownHeightCollection: getHeightCollection,
  closeKnownClient,
  saveKnownHeights,
  getNextKnownHeights,
}
