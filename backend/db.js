// backend/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  // These options help with connection stability
  maxPoolSize: 10, // Maximum simultaneous connections
  serverSelectionTimeoutMS: 5000, // Timeout if can't connect
  socketTimeoutMS: 45000, // How long to wait for operations
});

let db;
let isConnected = false;

export async function connectDB() {
  try {
    if (isConnected) {
      console.log("✅ Using existing MongoDB connection");
      return db;
    }

    await client.connect();
    db = client.db("happyBounty");
    isConnected = true;

    console.log("✅ MongoDB connected successfully");

    // Create indexes for better query performance
    await createIndexes();

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Exit if can't connect to database
  }
}

async function createIndexes() {
  try {
    // Indexes make queries faster
    const bounties = db.collection("bounties");
    const submissions = db.collection("submissions");
    const users = db.collection("users");

    // Bounties indexes
    await bounties.createIndex({ creator: 1 }); // Find by creator
    await bounties.createIndex({ status: 1 }); // Filter by status
    await bounties.createIndex({ deadline: 1 }); // Sort by deadline
    await bounties.createIndex({ category: 1 }); // Filter by category

    // Submissions indexes
    await submissions.createIndex({ bountyId: 1, user: 1 }); // Find user's submission for a bounty
    await submissions.createIndex({ user: 1 }); // Find all submissions by user
    await submissions.createIndex({ status: 1 }); // Filter by status (pending/accepted/rejected)

    // Users indexes
    await users.createIndex({ walletAddress: 1 }, { unique: true }); // Each wallet is unique

    console.log("✅ Database indexes created");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}

export function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
});
