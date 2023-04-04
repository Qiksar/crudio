import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer | undefined = undefined;

export const DbConnect = async (): Promise<string> => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  return uri;
};

export const DbDrop = async (): Promise<void> => {
  if (!!mongo) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
    mongo = undefined;
  }
};

export const DbDropCollections = async (): Promise<void> => {
  if (!!mongo) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await mongoose.connection.dropCollection(collection.collectionName);
    }
  }
};
