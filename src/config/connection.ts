import { Db, MongoClient } from "mongodb";
import "dotenv/config";
let db: Db;
let url: string = process.env.MONGO_URL || "";
export const client = new MongoClient(url);

const createIndexs = async () => {
  try {
    const db: Db = getDb();
    await db
      .collection("price_history")
      .createIndex(
        { coin_id: 1, timestamp: -1 },
        { name: "coin_timestamp_index" }
      );
    console.log("Index created on price_history collection");
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Connect to MongoDB and create index on price_history collection
export const connectToDb = async (): Promise<void> => {
  try {
    if (url === "") {
      throw new Error("MONGO_URL environment variable is not set");
    }
    await client.connect();
    console.log("Connected to mongoDbAtlas");
    db = client.db("koinXAssignment");
    await createIndexs();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error("Database not connected!");
  }
  return db;
};

export const closeDb = async (): Promise<void> => {
  try {
    await client.close();
    console.log("Connection to database closed successfully");
  } catch (error: any) {
    throw new Error(error.message);
  }
};
