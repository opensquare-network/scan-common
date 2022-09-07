async function getCollection(db, colName) {
  if (!db) {
    throw new Error(`Call getCollection after db is initialized`);
  }

  return new Promise((resolve, reject) => {
    db.listCollections({ name: colName }).next(async (err, info) => {
      if (!info) {
        const col = await db.createCollection(colName);
        resolve(col);
      } else if (err) {
        reject(err);
      }

      resolve(db.collection(colName));
    });
  });
}

module.exports = {
  getCollection,
}
