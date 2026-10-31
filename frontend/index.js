import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import ConnectDB from "./src/db/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, ".env")
});

// ============================================================================
// MONITORING STATE AND CONFIGURATION
// ============================================================================

const SLOW_QUERY_THRESHOLD = 1000; // milliseconds
const CONNECTION_INCREASE_THRESHOLD = 5; // connections
const MONITORED_COLLECTIONS = ["users", "products", "orders", "payments", "reviews"];

let previousConnectionCount = 0;
let previousIndexSnapshot = {};

// ============================================================================
// GEMMA 4 CONFIGURATION
// ============================================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemma-4-26b-a4b-it";

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function initializeDatabase() {
    await ConnectDB();

    if (!mongoose.connection.db) {
        throw new Error("MongoDB connection not established");
    }

    await mongoose.connection.db.admin().ping();

    console.log("Connected to MongoDB:", mongoose.connection.db.databaseName);
}

// ============================================================================
// MONITORING TOOL 1: SLOW QUERIES
// ============================================================================

async function monitorSlowQueries() {
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database is not connected");

        const slowQueries = [];

        // Check MongoDB system.profile collection for profiler records
        const profileCollection = db.collection("system.profile");
        const profileExists = await profileCollection.countDocuments();

        if (profileExists === 0) {
            return {
                success: false,
                warning: "MongoDB profiler is not enabled or no profiler records found. Enable profiling with: db.setProfilingLevel(1, { slowms: 1000 })",
                slowQueries: []
            };
        }

        // Query profiler records for slow queries
        const recentSlowQueries = await profileCollection
            .find({
                millis: { $gt: SLOW_QUERY_THRESHOLD }
            })
            .sort({ ts: -1 })
            .limit(10)
            .toArray();

        for (const record of recentSlowQueries) {
            const examined = record.execStats?.executionStats?.totalDocsExamined || 0;
            const returned = record.execStats?.executionStats?.nReturned || 
                           record.nReturned || 0;
            const ratio = examined > 0 ? returned / examined : 0;

            slowQueries.push({
                collection: record.ns || "unknown",
                operation: record.op || "unknown",
                query: record.command ? JSON.stringify(record.command) : "N/A",
                executionTime: record.millis,
                docsExamined: examined,
                docsReturned: returned,
                efficiency: `${(ratio * 100).toFixed(2)}%`,
                timestamp: record.ts
            });
        }

        return {
            success: true,
            threshold: SLOW_QUERY_THRESHOLD,
            found: slowQueries.length,
            slowQueries: slowQueries
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            note: "Profiler may not be enabled or accessible"
        };
    }
}

// ============================================================================
// MONITORING TOOL 2: BULK OPERATIONS
// ============================================================================

async function monitorBulkOperations() {
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database is not connected");

        const bulkOperations = [];
        const profileCollection = db.collection("system.profile");

        // Query for bulk operations (inserts, updates, deletes)
        const recentBulkOps = await profileCollection
            .find({
                $or: [
                    { op: "insert", ninserted: { $gt: 1 } },
                    { op: "update", nModified: { $gt: 1 } },
                    { op: "delete", ndeleted: { $gt: 1 } },
                    { op: "command", "command.update": { $exists: true } }
                ]
            })
            .sort({ ts: -1 })
            .limit(15)
            .toArray();

        for (const record of recentBulkOps) {
            const bulkSize = record.ninserted || record.nModified || record.ndeleted || 0;
            let severity = "low";

            // Escalate severity based on bulk size
            if (bulkSize > 100) severity = "medium";
            if (bulkSize > 1000) severity = "high";
            if (bulkSize > 10000) severity = "critical";

            // Additional severity for unfiltered operations
            const filter = record.command?.filter || {};
            if (Object.keys(filter).length === 0) {
                severity = severity === "critical" ? "critical" : "high";
            }

            bulkOperations.push({
                collection: record.ns || "unknown",
                operation: record.op,
                affectedDocuments: bulkSize,
                filter: JSON.stringify(filter) || "No filter (potentially dangerous)",
                severity: severity,
                timestamp: record.ts,
                executionTime: record.millis
            });
        }

        return {
            success: true,
            found: bulkOperations.length,
            bulkOperations: bulkOperations
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            note: "Bulk operations tracking may not be available"
        };
    }
}

// ============================================================================
// MONITORING TOOL 3: DATABASE CONNECTIONS
// ============================================================================

async function monitorDatabaseConnections() {
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database is not connected");

        const serverStatus = await db.admin().serverStatus();
        const currentConnections = serverStatus.connections.current;
        const availableConnections = serverStatus.connections.available;

        const connectionIncrease = currentConnections - previousConnectionCount;
        const isAbnormal = connectionIncrease > CONNECTION_INCREASE_THRESHOLD;

        // Update for next check
        const previousCount = previousConnectionCount;
        previousConnectionCount = currentConnections;

        return {
            success: true,
            currentConnections: currentConnections,
            availableConnections: availableConnections,
            maxConnections: serverStatus.connections.current + serverStatus.connections.available,
            previousConnections: previousCount,
            connectionIncrease: connectionIncrease,
            isAbnormal: isAbnormal,
            abnormalThreshold: CONNECTION_INCREASE_THRESHOLD,
            timestamp: new Date()
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            note: "Connection monitoring requires admin access"
        };
    }
}

// ============================================================================
// MONITORING TOOL 4: COLLECTION ACTIVITY
// ============================================================================

async function monitorCollectionActivity() {
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database is not connected");

        const activityData = [];
        const profileCollection = db.collection("system.profile");

        for (const collectionName of MONITORED_COLLECTIONS) {
            try {
                // Count documents in collection
                const collection = db.collection(collectionName);
                const docCount = await collection.estimatedDocumentCount();

                // Get recent operations from profiler
                const recentOps = await profileCollection
                    .find({ ns: { $regex: `\\.${collectionName}$` } })
                    .sort({ ts: -1 })
                    .limit(20)
                    .toArray();

                const reads = recentOps.filter(op => 
                    op.op === "query" || op.op === "find"
                ).length;

                const writes = recentOps.filter(op => 
                    op.op === "insert" || op.op === "update" || op.op === "delete"
                ).length;

                let docsExamined = 0;
                let docsReturned = 0;

                for (const op of recentOps) {
                    docsExamined += op.execStats?.executionStats?.totalDocsExamined || 0;
                    docsReturned += op.nReturned || 0;
                }

                activityData.push({
                    collection: collectionName,
                    documents: docCount,
                    recentOperations: recentOps.length,
                    reads: reads,
                    writes: writes,
                    docsExamined: docsExamined,
                    docsReturned: docsReturned,
                    avgDocsPerOp: recentOps.length > 0 
                        ? (docsExamined / recentOps.length).toFixed(2)
                        : 0
                });

            } catch (err) {
                activityData.push({
                    collection: collectionName,
                    error: err.message
                });
            }
        }

        return {
            success: true,
            analyzed: MONITORED_COLLECTIONS.length,
            activity: activityData,
            timestamp: new Date()
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            note: "Collection activity monitoring may require profiler access"
        };
    }
}

// ============================================================================
// MONITORING TOOL 5: INDEX CHANGES
// ============================================================================

async function monitorIndexChanges() {
    try {
        const db = mongoose.connection.db;
        if (!db) throw new Error("Database is not connected");

        const currentSnapshot = {};
        const indexChanges = [];
        let isFirstRun = Object.keys(previousIndexSnapshot).length === 0;

        for (const collectionName of MONITORED_COLLECTIONS) {
            try {
                const collection = db.collection(collectionName);
                const indexes = await collection.indexes();

                currentSnapshot[collectionName] = indexes.map(idx => ({
                    name: idx.name,
                    keys: JSON.stringify(idx.key),
                    unique: idx.unique || false,
                    sparse: idx.sparse || false
                }));

                // Compare with previous snapshot
                if (!isFirstRun && previousIndexSnapshot[collectionName]) {
                    const prevIndexes = previousIndexSnapshot[collectionName];
                    const currentIndexes = currentSnapshot[collectionName];

                    // Detect new indexes
                    for (const current of currentIndexes) {
                        const found = prevIndexes.some(prev => 
                            prev.name === current.name && 
                            prev.keys === current.keys
                        );
                        if (!found && current.name !== "_id_") {
                            indexChanges.push({
                                type: "CREATED",
                                collection: collectionName,
                                indexName: current.name,
                                keys: current.keys,
                                timestamp: new Date()
                            });
                        }
                    }

                    // Detect removed indexes
                    for (const prev of prevIndexes) {
                        const found = currentIndexes.some(current => 
                            current.name === prev.name && 
                            current.keys === prev.keys
                        );
                        if (!found && prev.name !== "_id_") {
                            indexChanges.push({
                                type: "REMOVED",
                                collection: collectionName,
                                indexName: prev.name,
                                keys: prev.keys,
                                timestamp: new Date()
                            });
                        }
                    }
                }

            } catch (err) {
                indexChanges.push({
                    error: `Could not analyze ${collectionName}: ${err.message}`
                });
            }
        }

        // Update snapshot
        previousIndexSnapshot = currentSnapshot;

        return {
            success: true,
            isFirstRun: isFirstRun,
            found: indexChanges.length,
            changes: indexChanges,
            currentIndexSnapshot: currentSnapshot,
            timestamp: new Date()
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            note: "Index monitoring requires appropriate database permissions"
        };
    }
}

// ============================================================================
// ORIGINAL TOOL: GET DATABASE DETAILS (PRESERVED)
// ============================================================================

async function getDatabaseDetails() {
    try {
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Database is not connected");
        }

        const collections = await db
            .listCollections({}, { nameOnly: true })
            .toArray();

        const databaseDetails = [];

        for (const collection of collections) {
            const collectionRef = db.collection(collection.name);

            const [documentCount, indexes] = await Promise.all([
                collectionRef.estimatedDocumentCount(),
                collectionRef.indexes()
            ]);

            databaseDetails.push({
                collectionName: collection.name,
                documentCount,
                indexes: indexes.map(index => ({
                    name: index.name,
                    keys: index.key,
                    unique: index.unique || false,
                    sparse: index.sparse || false
                }))
            });
        }

        return {
            success: true,
            databaseName: db.databaseName,
            totalCollections: collections.length,
            collections: databaseDetails
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// TOOL DECLARATIONS FOR GEMMA
// ============================================================================

const tools = [
    {
        functionDeclarations: [
            {
                name: "monitor_slow_queries",
                description: "Monitor and detect slow MongoDB queries exceeding the performance threshold (1000ms). Returns actual profiler records with query details, execution time, documents examined and returned. Essential for identifying performance bottlenecks.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },
            {
                name: "monitor_bulk_operations",
                description: "Detect potentially dangerous bulk modifications including bulk inserts, updates, and deletes. Identifies unfiltered operations and large-scale modifications. Returns severity levels based on affected document count.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },
            {
                name: "monitor_database_connections",
                description: "Monitor MongoDB database connection activity. Tracks current vs. previous connection counts and identifies unusual connection spikes. Use this to detect potential connection-based anomalies.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },
            {
                name: "monitor_collection_activity",
                description: "Analyze read and write activity across the five sample collections (users, products, orders, payments, reviews). Returns operation counts, documents examined and returned per collection.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },
            {
                name: "monitor_index_changes",
                description: "Detect unexpected index modifications across monitored collections. Identifies newly created or removed indexes. First run establishes baseline; subsequent runs detect changes.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },
            {
                name: "get_database_details",
                description: "Fetch the MongoDB database name, collection names, estimated document counts and indexes. Use this to inspect the overall database structure and metadata.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            }
        ]
    }
];

// ============================================================================
// TOOL EXECUTION
// ============================================================================

const availableTools = {
    monitor_slow_queries: monitorSlowQueries,
    monitor_bulk_operations: monitorBulkOperations,
    monitor_database_connections: monitorDatabaseConnections,
    monitor_collection_activity: monitorCollectionActivity,
    monitor_index_changes: monitorIndexChanges,
    get_database_details: getDatabaseDetails
};

async function executeTool(functionCall) {
    const toolFunction = availableTools[functionCall.name];

    if (!toolFunction) {
        return {
            success: false,
            error: "Tool not found"
        };
    }

    try {
        return await toolFunction(functionCall.args || {});
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// SYSTEM INSTRUCTION
// ============================================================================

const systemInstruction = `
You are MongoMind, an intelligent MongoDB monitoring and suspicious-activity detection assistant.

Your responsibilities:

1. Use available monitoring tools to retrieve actual database information.
2. Detect slow queries, unusual bulk operations, connection spikes, and suspicious activity.
3. Analyze collection activity patterns and index modifications.
4. Explain potential root causes of performance problems and suspicious activity.
5. Recommend evidence-based solutions and optimizations.

CRITICAL RULES:

- Always use monitoring tools to retrieve actual data - NEVER invent statistics or query information.
- Distinguish between confirmed suspicious activity and normal operations.
- Clearly explain WHY something is suspicious, not just THAT it is suspicious.
- Preserve original queries exactly as they appear in profiler records.
- Have read-only database inspection access only.
- Never execute database modifications or AI-generated MongoDB commands.
- Never create, delete or modify indexes, collections or documents.
- Never modify the existing Incident model schema.
- All proposed database changes require explicit developer approval.

When suspicious activity is found, provide structured analysis:
- Detection type (e.g., slow query, bulk operation, connection spike)
- Collection name and operation details
- Original query or operation (preserved exactly)
- Severity level: low, medium, high, or critical
- Root cause analysis based on evidence
- Recommended solution
- Proposed changes (for developer review only)

You are currently connected to the HackOct database with five monitored collections:
- users (100 documents)
- products (100 documents)
- orders (100 documents)
- payments (100 documents)
- reviews (100 documents)

Use these tools proactively to monitor the system and inform the user of any anomalies.
`;

// ============================================================================
// CONVERSATION HISTORY
// ============================================================================

const contents = [];

// ============================================================================
// GEMMA RESPONSE + FUNCTION CALLING
// ============================================================================

async function chat(userInput) {

    contents.push({
        role: "user",
        parts: [{ text: userInput }]
    });

    try {

        // Allow multiple tool-calling rounds.
        for (let iteration = 0; iteration < 5; iteration++) {

            const response = await ai.models.generateContent({
                model: MODEL,
                contents,
                config: {
                    systemInstruction,
                    tools
                }
            });

            const modelContent = response.candidates?.[0]?.content;

            if (!modelContent) {
                throw new Error("Gemma returned an empty response");
            }

            // Preserve the model's response in conversation history.
            contents.push(modelContent);

            const functionCalls = response.functionCalls || [];

            // No tool call: display final response.
            if (functionCalls.length === 0) {
                console.log("\nMongoMind:", response.text || "No text response");
                return;
            }

            // Execute each requested, allowlisted tool.
            const functionResponses = [];

            for (const functionCall of functionCalls) {

                console.log(`\nExecuting tool: ${functionCall.name}`);

                const result = await executeTool(functionCall);

                functionResponses.push({
                    functionResponse: {
                        name: functionCall.name,
                        response: result
                    }
                });
            }

            // Send tool results back to Gemma.
            contents.push({
                role: "user",
                parts: functionResponses
            });
        }

        console.log("\nMongoMind: Maximum tool-calling rounds reached.");

    } catch (error) {
        console.error("\nGemma error:", error.message);
    }
}

let rl = null;

async function startChat() {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                MONGOMIND AI MONITOR                        ║");
    console.log("║     MongoDB Monitoring & Suspicious Activity Detection     ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("Model:", MODEL);
    console.log("\n📊 Available Monitoring Tools:");
    console.log("  1. Check for slow queries");
    console.log("  2. Detect bulk operations");
    console.log("  3. Monitor database connections");
    console.log("  4. Analyze collection activity");
    console.log("  5. Track index changes");
    console.log("  6. Get database structure\n");
    console.log("Examples:");
    console.log('  - "Check for slow queries"');
    console.log('  - "Are there any bulk operations happening?"');
    console.log('  - "Show me database connections"');
    console.log('  - "Analyze collection activity"\n');
    console.log("Type 'exit' to quit.\n");

    rl.setPrompt("You: ");
    rl.prompt();

    rl.on("line", async (input) => {

        const userInput = input.trim();

        if (!userInput) {
            rl.prompt();
            return;
        }

        if (userInput.toLowerCase() === "exit") {
            rl.close();
            return;
        }

        await chat(userInput);

        console.log("");
        rl.prompt();
    });

    rl.on("close", () => {
        console.log("\nMongoMind stopped.");
        process.exit(0);
    });
}

// ============================================================================
// APPLICATION START
// ============================================================================

async function main() {
    try {

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing from .env");
        }

        await initializeDatabase();

        startChat();

    } catch (error) {
        console.error("Startup error:", error.message);
        process.exit(1);
    }
}

// Only run interactive CLI if executed directly via node index.js
const isDirectExecution = Boolean(
    process.argv[1] &&
    path.resolve(process.argv[1]).toLowerCase() === path.resolve(__filename).toLowerCase()
);

if (isDirectExecution) {
    main();
}

export {
    initializeDatabase,
    monitorSlowQueries,
    monitorBulkOperations,
    monitorDatabaseConnections,
    monitorCollectionActivity,
    monitorIndexChanges,
    getDatabaseDetails,
    chat,
    executeTool,
    main,
    ai,
    MODEL
};
