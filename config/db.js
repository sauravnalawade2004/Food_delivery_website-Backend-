
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);


import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
export const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB) , {
            serverSelectionTimeoutMS: 5000,
        }
        console.log("MongoDB connected");
    } catch (err) {
        console.log("MongoDB connection failed", err);
    }
}