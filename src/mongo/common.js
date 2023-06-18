async function getCollection(db, colName) {
  if (!db) {
    throw new Error(`Call getCollection after db is initialized`);
  }

  return db.collection(colName);
}

module.exports = {
  getCollection,
}
