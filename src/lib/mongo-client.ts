import { MongoClient } from "mongodb";

declare global {
  var rawMongoClient: MongoClient | undefined;
  var rawMongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/intra_talleres";

const mongoDbName = process.env.MONGODB_DB || "intra_talleres";

function createClientPromise() {
  const client = global.rawMongoClient ?? new MongoClient(mongoUri);
  if (!global.rawMongoClient) {
    global.rawMongoClient = client;
  }
  return client.connect();
}

const rawMongoClient = global.rawMongoClient ?? new MongoClient(mongoUri);

if (!global.rawMongoClient) {
  global.rawMongoClient = rawMongoClient;
}

const rawMongoClientPromise =
  global.rawMongoClientPromise ?? createClientPromise();

if (!global.rawMongoClientPromise) {
  global.rawMongoClientPromise = rawMongoClientPromise;
}

export async function ensureRawMongoConnection() {
  return rawMongoClientPromise;
}

export async function getRawMongoDb() {
  const client = await ensureRawMongoConnection();
  return client.db(mongoDbName);
}

export function getRawMongoDbSync() {
  return rawMongoClient.db(mongoDbName);
}
