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
      serverSelectionTimeoutMS: 5000, // Time out after 5 seconds when connecting to the server
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
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
