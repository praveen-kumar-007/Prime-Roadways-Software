const { MongoClient } = require("mongodb");
require('dotenv').config();

// Global reference for db
const dbConnection = {
  db: null,
};

async function initMongo() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/primeroadways";
    
    const client = new MongoClient(mongoUri, { family: 4 });
    await client.connect();
    
    let dbName = "primeroadways";
    try {
      const parsedUrl = new URL(mongoUri);
      if (parsedUrl.pathname && parsedUrl.pathname.length > 1) {
         dbName = parsedUrl.pathname.substring(1);
      }
    } catch(e) { /* ignore url parse error */ }

    dbConnection.db = client.db(dbName);
    console.log(`[MongoDB] Connected successfully to database: ${dbName}`);
  } catch (err) {
    console.error("[MongoDB] Connection error:", err.message);
    throw err;
  }
}

module.exports = {
  getDb: () => {
    if (!dbConnection.db) {
      throw new Error("Database not initialized! Call initMongo() first.");
    }
    return dbConnection.db;
  },
  initMongo,
};
