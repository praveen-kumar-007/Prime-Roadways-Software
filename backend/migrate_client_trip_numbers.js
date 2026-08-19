require('dotenv').config();
const { MongoClient } = require('mongodb');

const getClientShortForm = (clientName) => {
  if (!clientName) return "PR";
  const clean = clientName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length >= 4) {
    return clean.substring(0, 4);
  }
  return clean.padEnd(4, 'X');
};

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI not found in env.");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri, { family: 4 });
  await client.connect();
  
  let dbName = "primeroadways";
  try {
    const parsedUrl = new URL(mongoUri);
    if (parsedUrl.pathname && parsedUrl.pathname.length > 1) {
       dbName = parsedUrl.pathname.substring(1);
    }
  } catch(e) { }

  const db = client.db(dbName);
  console.log(`Connected to database: ${dbName}`);
  
  console.log("Fetching all trip_mis entries...");
  const trips = await db.collection("trip_mis").find({}).toArray();
  console.log(`Loaded ${trips.length} entries. Sorting chronologically...`);
  
  trips.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || 0);
    const dateB = new Date(b.createdAt || b.date || 0);
    return dateA - dateB;
  });
  
  // Group by client short form
  const clientGroups = {};
  trips.forEach(trip => {
    const prefix = getClientShortForm(trip.clientName);
    if (!clientGroups[prefix]) {
      clientGroups[prefix] = [];
    }
    clientGroups[prefix].push(trip);
  });
  
  console.log("Generating new sequential trip numbers...");
  let updateCount = 0;
  
  for (const prefix in clientGroups) {
    const list = clientGroups[prefix];
    console.log(`Client ${prefix}: ${list.length} trips`);
    let seq = 0;
    for (const trip of list) {
      seq++;
      const newTripNo = `${prefix} ${String(seq).padStart(4, '0')}`;
      if (trip.tripNo !== newTripNo) {
        console.log(`Updating ${trip.tripNo || 'empty'} -> ${newTripNo} for doc id ${trip._id}`);
        await db.collection("trip_mis").updateOne(
          { _id: trip._id },
          { $set: { tripNo: newTripNo } }
        );
        updateCount++;
      }
    }
  }
  
  console.log(`Migration complete! Successfully updated ${updateCount} entries.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
