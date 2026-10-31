/**
 * MongoDB Sample Datasets Import Script
 * 
 * Safely imports sample datasets from mongodb-sample-dataset repository
 * into the existing HackOct database.
 * 
 * Usage: node scripts/importDatasets.js [repository-path]
 * Example: node scripts/importDatasets.js /tmp/mongodb-sample-dataset
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const mongoose = require("mongoose");
const ConnectDB = require("../src/db/db");

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATASET_MAPPING = {
    "sample_airbnb": {
        "listingsAndReviews.json": "sample_airbnb_listings"
    },
    "sample_analytics": {
        "accounts.json": "sample_analytics_accounts",
        "customers.json": "sample_analytics_customers",
        "transactions.json": "sample_analytics_transactions"
    },
    "sample_geospatial": {
        "shipwrecks.json": "sample_geospatial_shipwrecks"
    },
    "sample_mflix": {
        "comments.json": "sample_mflix_comments",
        "movies.json": "sample_mflix_movies",
        "sessions.json": "sample_mflix_sessions",
        "theaters.json": "sample_mflix_theaters",
        "users.json": "sample_mflix_users"
    },
    "sample_supplies": {
        "sales.json": "sample_supplies_sales"
    },
    "sample_training": {
        "companies.json": "sample_training_companies",
        "grades.json": "sample_training_grades",
        "inspections.json": "sample_training_inspections",
        "posts.json": "sample_training_posts",
        "routes.json": "sample_training_routes",
        "stories.json": "sample_training_stories",
        "trips.json": "sample_training_trips",
        "tweets.json": "sample_training_tweets",
        "zips.json": "sample_training_zips"
    },
    "sample_weatherdata": {
        "data.json": "sample_weatherdata"
    }
};

// ============================================================================
// IMPORT REPORT
// ============================================================================

const importReport = {
    startTime: new Date(),
    endTime: null,
    duration: null,
    repositoryPath: null,
    datasetsFolders: 0,
    datasetFiles: 0,
    successfulImports: 0,
    collectionsCreated: [],
    documentsByCollection: {},
    skippedDocuments: 0,
    failedDocuments: 0,
    totalDocuments: 0,
    errors: []
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse BSON Extended JSON format
 * Converts $oid, $numberInt, $numberLong, etc. to native types
 */
function parseBsonJson(doc) {
    try {
        if (doc._id && typeof doc._id === "object") {
            // Handle ObjectId format
            if (doc._id.$oid) {
                doc._id = new mongoose.Types.ObjectId(doc._id.$oid);
            }
        }

        // Parse all numeric values in Extended JSON format
        const parsed = JSON.parse(JSON.stringify(doc), (key, value) => {
            if (value === null || typeof value !== "object") return value;

            if (value.$oid) return new mongoose.Types.ObjectId(value.$oid);
            if (value.$numberInt) return parseInt(value.$numberInt);
            if (value.$numberLong) return BigInt(value.$numberLong);
            if (value.$numberDouble) return parseFloat(value.$numberDouble);
            if (value.$date) return new Date(value.$date);

            return value;
        });

        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse BSON JSON: ${error.message}`);
    }
}

/**
 * Read JSON file line by line to handle large files
 */
async function readJsonLines(filePath) {
    return new Promise((resolve, reject) => {
        const documents = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity
        });

        rl.on("line", (line) => {
            if (line.trim()) {
                try {
                    const doc = JSON.parse(line);
                    documents.push(doc);
                } catch (error) {
                    console.error(`  ❌ Failed to parse line in ${filePath}: ${error.message}`);
                    importReport.failedDocuments++;
                }
            }
        });

        rl.on("end", () => {
            resolve(documents);
        });

        rl.on("error", reject);
    });
}

/**
 * Check if collection already exists and has documents
 */
async function collectionExists(collectionName) {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const exists = collections.some(c => c.name === collectionName);

        if (exists) {
            const count = await mongoose.connection.db
                .collection(collectionName)
                .estimatedDocumentCount();
            return count > 0;
        }

        return false;
    } catch (error) {
        console.error(`Error checking collection: ${error.message}`);
        return false;
    }
}

/**
 * Import documents into a collection
 */
async function importCollection(filePath, collectionName, batchSize = 1000) {
    try {
        console.log(`  📂 Reading: ${path.basename(filePath)}`);

        // Check if collection already exists
        const exists = await collectionExists(collectionName);
        if (exists) {
            console.log(`  ⏭️  Skipping (collection '${collectionName}' already has data)`);
            return { skipped: true, count: 0 };
        }

        // Read all documents from file
        const documents = await readJsonLines(filePath);

        if (documents.length === 0) {
            console.log(`  ⚠️  No documents found in file`);
            return { skipped: true, count: 0 };
        }

        console.log(`  📦 Importing ${documents.length} documents...`);

        // Parse BSON JSON format
        const parsedDocs = documents.map(doc => {
            try {
                return parseBsonJson(doc);
            } catch (error) {
                importReport.failedDocuments++;
                return null;
            }
        }).filter(doc => doc !== null);

        // Insert in batches
        const collection = mongoose.connection.db.collection(collectionName);
        let inserted = 0;

        for (let i = 0; i < parsedDocs.length; i += batchSize) {
            const batch = parsedDocs.slice(i, i + batchSize);

            try {
                const result = await collection.insertMany(batch, { ordered: false });
                inserted += result.insertedCount;
            } catch (error) {
                // Handle duplicate key errors
                if (error.code === 11000) {
                    // Some documents may have been inserted before the duplicate
                    console.log(`  ⚠️  Duplicate key error in batch (some documents may be duplicates)`);
                }
            }
        }

        console.log(`  ✅ Imported ${inserted} documents into '${collectionName}'`);
        return { skipped: false, count: inserted };

    } catch (error) {
        console.error(`  ❌ Import failed for ${collectionName}: ${error.message}`);
        importReport.errors.push({
            file: filePath,
            collection: collectionName,
            error: error.message
        });
        return { skipped: true, count: 0 };
    }
}

/**
 * Verify imported data by querying collections
 */
async function verifyImports() {
    console.log("\n📊 Verifying imported data...\n");

    for (const [collectionName, count] of Object.entries(importReport.documentsByCollection)) {
        try {
            const collection = mongoose.connection.db.collection(collectionName);
            const actualCount = await collection.estimatedDocumentCount();
            const sampleDoc = await collection.findOne({});

            const status = actualCount === count ? "✅" : "⚠️";
            console.log(`${status} ${collectionName}: ${actualCount} documents`);

            if (sampleDoc) {
                console.log(`   Sample: ${JSON.stringify(sampleDoc).substring(0, 80)}...`);
            }
        } catch (error) {
            console.error(`❌ Verification failed for ${collectionName}: ${error.message}`);
        }
    }
}

/**
 * Generate final import report
 */
function generateReport() {
    importReport.endTime = new Date();
    importReport.duration = (importReport.endTime - importReport.startTime) / 1000;

    console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║           DATASET IMPORT REPORT                                  ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log(`📅 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`📂 Repository: ${importReport.repositoryPath}`);
    console.log(`⏱️  Duration: ${importReport.duration.toFixed(2)} seconds\n`);

    console.log("📊 Statistics:");
    console.log(`   Dataset Folders: ${importReport.datasetsFolders}`);
    console.log(`   Dataset Files: ${importReport.datasetFiles}`);
    console.log(`   Successful Imports: ${importReport.successfulImports}`);
    console.log(`   Collections Created: ${importReport.collectionsCreated.length}`);
    console.log(`   Total Documents Imported: ${importReport.totalDocuments}`);
    console.log(`   Failed Documents: ${importReport.failedDocuments}`);
    console.log(`   Skipped Documents: ${importReport.skippedDocuments}\n`);

    console.log("📋 Collections:");
    for (const [collectionName, count] of Object.entries(importReport.documentsByCollection)) {
        console.log(`   ✓ ${collectionName}: ${count} documents`);
    }

    if (importReport.errors.length > 0) {
        console.log("\n⚠️  Errors:");
        for (const err of importReport.errors) {
            console.log(`   ❌ ${path.basename(err.file)} → ${err.collection}`);
            console.log(`      ${err.error}`);
        }
    }

    console.log("\n" + "═".repeat(66));
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importDatasets(repositoryPath) {
    try {
        console.log("\n╔════════════════════════════════════════════════════════════════╗");
        console.log("║      MongoDB Sample Datasets Import Script                      ║");
        console.log("╚════════════════════════════════════════════════════════════════╝\n");

        // Validate repository path
        if (!fs.existsSync(repositoryPath)) {
            throw new Error(`Repository path not found: ${repositoryPath}`);
        }

        importReport.repositoryPath = repositoryPath;

        // Connect to database
        console.log("🔌 Connecting to MongoDB...");
        await ConnectDB();
        console.log(`✅ Connected to database: ${mongoose.connection.db.databaseName}\n`);

        // Verify HackOct database
        if (mongoose.connection.db.databaseName !== "HackOct") {
            throw new Error(
                `Wrong database! Connected to '${mongoose.connection.db.databaseName}', expected 'HackOct'`
            );
        }

        // Check for existing incidents collection (protect user data)
        console.log("🛡️  Verifying existing data integrity...");
        const collections = await mongoose.connection.db.listCollections().toArray();
        const incidentsExists = collections.some(c => c.name === "incidents");

        if (incidentsExists) {
            const incidentsCount = await mongoose.connection.db
                .collection("incidents")
                .estimatedDocumentCount();
            console.log(`   ✓ Incidents collection found (${incidentsCount} documents - will not be modified)\n`);
        }

        // Import datasets
        console.log("📥 Importing datasets...\n");

        for (const [datasetFolder, fileMapping] of Object.entries(DATASET_MAPPING)) {
            const datasetPath = path.join(repositoryPath, datasetFolder);

            if (!fs.existsSync(datasetPath)) {
                console.log(`⏭️  Skipping ${datasetFolder} (not found)\n`);
                continue;
            }

            importReport.datasetsFolders++;
            console.log(`📁 ${datasetFolder}`);

            for (const [fileName, collectionName] of Object.entries(fileMapping)) {
                const filePath = path.join(datasetPath, fileName);

                if (!fs.existsSync(filePath)) {
                    console.log(`  ⏭️  Skipping ${fileName} (not found)`);
                    continue;
                }

                importReport.datasetFiles++;

                try {
                    const result = await importCollection(filePath, collectionName);

                    if (!result.skipped) {
                        importReport.successfulImports++;
                        importReport.collectionsCreated.push(collectionName);
                        importReport.documentsByCollection[collectionName] = result.count;
                        importReport.totalDocuments += result.count;
                    } else {
                        importReport.skippedDocuments += result.count;
                    }
                } catch (error) {
                    console.error(`  ❌ Error importing ${fileName}: ${error.message}`);
                }
            }

            console.log("");
        }

        // Verify imports
        await verifyImports();

        // Generate report
        generateReport();

        // Verify incidents collection still exists
        console.log("\n🛡️  Final data integrity check...");
        const finalCollections = await mongoose.connection.db.listCollections().toArray();
        const incidentsStillExists = finalCollections.some(c => c.name === "incidents");

        if (incidentsStillExists) {
            const finalIncidentsCount = await mongoose.connection.db
                .collection("incidents")
                .estimatedDocumentCount();
            console.log(`✅ Incidents collection preserved (${finalIncidentsCount} documents)\n`);
        }

        console.log("✅ Import completed successfully!\n");

    } catch (error) {
        console.error(`\n❌ Import failed: ${error.message}\n`);
        importReport.errors.push({ error: error.message });
        process.exit(1);
    } finally {
        // Disconnect
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log("Disconnected from MongoDB\n");
        }
    }
}

// ============================================================================
// SCRIPT ENTRY POINT
// ============================================================================

// Get repository path from command line or use default
const repositoryPath = process.argv[2] || "/tmp/mongodb-sample-dataset";

importDatasets(repositoryPath);
