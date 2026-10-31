require("dotenv").config();

const mongoose = require("mongoose");
const { spawn } = require("child_process");
const path = require("path");
const app = require("../backend/src/app");

const PORT = process.env.PORT || 3000;

// Store reference to child process
let mongoMindProcess = null;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            
            // Start MongoMind (index.js) as a child process
            startMongoMind();
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

/**
 * Start MongoMind as a child process
 */
function startMongoMind() {
    console.log("\n🚀 Starting MongoMind AI...\n");

    const indexPath = path.join(__dirname, "index.js");

    // Spawn the index.js process
    mongoMindProcess = spawn("node", [indexPath], {
        stdio: "inherit",  // Inherit parent's stdio to see MongoMind output
        cwd: __dirname
    });

    // Handle process exit
    mongoMindProcess.on("exit", (code) => {
        console.log(`\n⚠️  MongoMind exited with code ${code}`);
        // Optionally restart it
        // startMongoMind();
    });

    mongoMindProcess.on("error", (err) => {
        console.error("Failed to start MongoMind:", err.message);
    });
}

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
    console.log("\n\n📛 Shutting down server...");
    
    // Kill MongoMind process
    if (mongoMindProcess) {
        mongoMindProcess.kill();
    }
    
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("\n\n📛 Server terminated");
    
    if (mongoMindProcess) {
        mongoMindProcess.kill();
    }
    
    process.exit(0);
});

startServer();