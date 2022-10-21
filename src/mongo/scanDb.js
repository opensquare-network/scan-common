const { MongoClient } = require("mongodb");
const { getCollection } = require("./common");

const statusColName = "status";
const genesisHeight = 1;
const mainScanName = "main-scan-height";

class ScanDb {
  #client;
  #db;
  #dbName;
  #clientInitPromise;
  #statusCol;

  constructor(mongoUrl, dbName) {
    this.#clientInitPromise = MongoClient.connect(mongoUrl, {
      useUnifiedTopology: true,
    });

    this.#dbName = dbName;
  }

  async init() {
    this.#client = await this.#clientInitPromise;
    this.#db = this.#client.db(this.#dbName);
    this.#statusCol = await getCollection(this.#db, statusColName);
  }

  #checkInit() {
    if (!this.#db) {
      throw new Error(`Database is not initialized`)
    }
  }

  async createCol(colName) {
    this.#checkInit();
    return await getCollection(this.#db, colName);
  }

  async getStatusCol() {
    return this.#statusCol;
  }

  async getNextScanHeight() {
    const heightInfo = await this.#statusCol.findOne({ name: mainScanName });

    if (!heightInfo) {
      return genesisHeight;
    } else if (typeof heightInfo.value === "number") {
      return heightInfo.value + 1;
    } else {
      console.error("Scan height value error in DB!");
      process.exit(1);
    }
  }

  async getScanHeight() {
    const heightInfo = await this.#statusCol.findOne({ name: mainScanName });
    if (heightInfo) {
      return parseInt(heightInfo.value);
    }

    return 0;
  }

  async updateScanHeight(height) {
    await this.#statusCol.updateOne(
      { name: mainScanName },
      { $set: { value: height } },
      { upsert: true }
    );
  }

  async close() {
    this.#checkInit();
    await this.#client.close();
  }
}

module.exports = {
  ScanDb,
}
