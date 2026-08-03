require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedSuperAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri === 'your_mongodb_connection_string_here') {
    console.error("❌ Please set a valid MONGODB_URI in your .env file first.");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri, { family: 4 });

  try {
    await client.connect();
    
    let dbName = "primeroadways";
    try {
      const parsedUrl = new URL(mongoUri);
      if (parsedUrl.pathname && parsedUrl.pathname.length > 1) {
         dbName = parsedUrl.pathname.substring(1);
      }
    } catch(e) { }

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const adminEmail = 'praveen.pr105@gmail.com';
    const adminPassword = '123456'; // Change this after logging in!

    // Check if superadmin already exists
    const existing = await usersCollection.findOne({ email: adminEmail });
    if (existing) {
      console.log(`⚠️ User ${adminEmail} already exists! Skipping seed.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const superAdmin = {
      name: 'Prime Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'SuperAdmin',
      createdAt: new Date(),
      failedLoginAttempts: 0,
      isBlocked: false
    };

    await usersCollection.insertOne(superAdmin);
    
    console.log("✅ Successfully seeded Super Admin user!");
    console.log("-----------------------------------------");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("-----------------------------------------");
    console.log("IMPORTANT: Please log in and change your password immediately.");

  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
  } finally {
    await client.close();
  }
}

seedSuperAdmin();
