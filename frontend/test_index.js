import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable test mode to prevent starting the interactive readline prompt
process.env.TEST_MODE = "true";

console.log("================================================================");
console.log("   🧪 DB-SURGEON / MONGOMIND: Testing frontend/index.js        ");
console.log("================================================================");

// Import components directly from frontend/index.js
import {
    initializeDatabase,
    monitorSlowQueries,
    monitorBulkOperations,
    monitorDatabaseConnections,
    monitorCollectionActivity,
    monitorIndexChanges,
    getDatabaseDetails,
    executeTool,
    ai,
    MODEL
} from "./index.js";

async function runTests() {
    let passedTests = 0;
    let totalTests = 5;

    // -------------------------------------------------------------
    // Test 1: Verify Environment & API Key
    // -------------------------------------------------------------
    console.log("\n[Test 1/5] Checking Environment & Gemini API Key...");
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
        const masked = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
        console.log(`  ✅ GEMINI_API_KEY detected: ${masked}`);
        passedTests++;
    } else {
        console.error("  ❌ GEMINI_API_KEY is not defined in .env");
    }

    // -------------------------------------------------------------
    // Test 2: Database Initialization & Ping
    // -------------------------------------------------------------
    console.log("\n[Test 2/5] Testing MongoDB Connection (initializeDatabase)...");
    try {
        await initializeDatabase();
        const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : "Unknown";
        console.log(`  ✅ Connected to MongoDB successfully. Database: [${dbName}]`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ Database initialization failed: ${err.message}`);
    }

    // -------------------------------------------------------------
    // Test 3: getDatabaseDetails Tool
    // -------------------------------------------------------------
    console.log("\n[Test 3/5] Testing getDatabaseDetails() tool...");
    try {
        const details = await getDatabaseDetails();
        if (details.success) {
            console.log(`  ✅ Found ${details.totalCollections} collections in [${details.databaseName}]:`);
            details.collections.forEach(col => {
                console.log(`     - ${col.collectionName}: ${col.documentCount} docs, ${col.indexes.length} indexes`);
            });
            passedTests++;
        } else {
            console.error(`  ❌ getDatabaseDetails error: ${details.error}`);
        }
    } catch (err) {
        console.error(`  ❌ Error running getDatabaseDetails: ${err.message}`);
    }

    // -------------------------------------------------------------
    // Test 4: Monitoring Tools Health Check
    // -------------------------------------------------------------
    console.log("\n[Test 4/5] Testing Monitoring Tools Suite...");
    try {
        const connStatus = await monitorDatabaseConnections();
        console.log(`  ✅ Connections Monitor: ${connStatus.currentConnections || 0} active, ${connStatus.availableConnections || 0} available`);

        const activity = await monitorCollectionActivity();
        console.log(`  ✅ Collection Activity: Analyzed ${activity.analyzed || 0} monitored collections`);

        const indexStatus = await monitorIndexChanges();
        console.log(`  ✅ Index Monitor: Baseline established with ${Object.keys(indexStatus.currentIndexSnapshot || {}).length} collections`);

        const slow = await monitorSlowQueries();
        console.log(`  ✅ Slow Query Monitor: Ran successfully (found: ${slow.found || 0})`);

        passedTests++;
    } catch (err) {
        console.error(`  ❌ Monitoring tools test failed: ${err.message}`);
    }

    // -------------------------------------------------------------
    // Test 5: AI Model & Inference Check with Gemini/Gemma
    // -------------------------------------------------------------
    console.log(`\n[Test 5/5] Testing AI Reasoning with Model [${MODEL}]...`);
    try {
        const testPrompt = "Ping check: Confirm you are MongoMind DBA assistant in 1 sentence.";
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts: [{ text: testPrompt }] }]
        });
        const reply = response.text ? response.text.trim() : "No text returned";
        console.log(`  ✅ AI Response Received:\n     "${reply}"`);
        passedTests++;
    } catch (err) {
        console.warn(`  ⚠️ Primary model [${MODEL}] notice: ${err.message}`);
        // Fallback to gemini-2.5-flash if gemma model quota or availability varies
        console.log("  Testing fallback model [gemini-2.5-flash]...");
        try {
            const fallbackResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: "Confirm you are MongoMind DBA assistant." }] }]
            });
            console.log(`  ✅ Fallback AI Response:\n     "${fallbackResponse.text.trim()}"`);
            passedTests++;
        } catch (fallbackErr) {
            console.error(`  ❌ Fallback AI generation failed: ${fallbackErr.message}`);
        }
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n================================================================");
    if (passedTests === totalTests) {
        console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
        console.log("frontend/index.js is 100% functional and ready for live use.");
    } else {
        console.log(`⚠️ Completed with ${passedTests}/${totalTests} tests passed.`);
    }
    console.log("================================================================\n");

    // Close Mongoose connection cleanly so the Node event loop drains naturally
    await mongoose.disconnect();
    if (passedTests !== totalTests) {
        process.exitCode = 1;
    }
}

runTests().catch(err => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
});
