import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default async function ConnectDB() {
    try {
        const mongoUrl = process.env.MONGO_URL || "mongodb+srv://krishnrajshivolkar:krishnrajshivolkarplannora211205@backend.6ujsigm.mongodb.net/HackOct?appName=Backend";
        await mongoose.connect(mongoUrl);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        throw error;
    }
}
export { ConnectDB };
