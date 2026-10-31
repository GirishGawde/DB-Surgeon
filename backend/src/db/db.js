const mongoose = require("mongoose");
require("dotenv").config();

async function ConnectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        throw error;
    }
}

module.exports = ConnectDB;
