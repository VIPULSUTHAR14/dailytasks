import { MongoClient } from 'mongodb'

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

export const dbcollection = async (collection: string) => {
    const client = await clientPromise;
    const db = client.db(database_name);
    return db.collection(collection);
}