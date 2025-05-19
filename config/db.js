import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const connectDB = async () => {
  try {
    const mongo_uri = process.env.MONGODB_URI;

    if (!mongo_uri) {
      throw new Error("MongoDB URI is missing in .env file");
    }

    // Set MongoDB connection options with timeouts
    const options = {
      serverSelectionTimeoutMS: 60000, // Time out after 60 seconds when connecting to the server
      socketTimeoutMS: 180000, // Close sockets after 180 seconds of inactivity
      connectTimeoutMS: 100000, // Give up initial connection after 100 seconds
    };

    const conn = await mongoose.connect(mongo_uri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ Couldn't connect to MongoDB: ${err.message}`);
    // Don't exit the process, let the server continue running even if DB connection fails
    // process.exit(1);
  }
};

export default connectDB;
