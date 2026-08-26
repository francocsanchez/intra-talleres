import mongoose from "mongoose";

declare global {
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/intra_talleres";

export async function connectToMongo() {
  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "intra_talleres",
    });
  }

  return global.mongooseConnectionPromise;
}
