import { MongoClient, Db } from 'mongodb'

const mongoUri = process.env.MONGO_DB_URI || "";

const options = {};
if (!process.env.MONGO_DB_URI) {
    throw new Error("Please check the Mongo URI ");
}

const database_name = process.env.MONGO_DB_DATABASE_NAME;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
declare global {
    var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV == "development") {
    if (!global._mongoClientPromise) {
        client = new MongoClient(mongoUri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(mongoUri, options);
    clientPromise = client.connect();
}

export default clientPromise;

let indexesCreated = false;
async function ensureIndexes(db: Db) {
    if (indexesCreated) return;
    indexesCreated = true;
    try {
        await Promise.all([
            db.collection("sessions").createIndex({ hashedToken: 1 }),
            db.collection("sessions").createIndex({ ExpireAt: 1 }, { expireAfterSeconds: 0 }),
            db.collection("users").createIndex({ email: 1 }),
            db.collection("tasks").createIndex({ user_id: 1 }),
            db.collection("dsaquestions").createIndex({ user_id: 1 }),
            db.collection("dsapattern").createIndex({ user_id: 1 }),
            db.collection("dsatopics").createIndex({ user_id: 1 }),
            db.collection("timetable").createIndex({ userId: 1 }),
            db.collection("aptitude").createIndex({ user_id: 1 }),
        ]);
    } catch (e) {
        console.error("Failed to ensure indexes:", e);
        indexesCreated = false;
    }
}

export const dbcollection = async (collection: string) => {
    const client = await clientPromise;
    const db = client.db(database_name);
    
    // Asynchronously ensure indexes exist without blocking the current request
    ensureIndexes(db);
    
    return db.collection(collection);
}