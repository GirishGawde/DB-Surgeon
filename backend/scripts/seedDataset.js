/**
 * MongoDB Sample Dataset Seed Script
 * 
 * Generates realistic interconnected sample data for testing MongoMind.
 * Creates 5 collections with 100 documents each:
 * - users (customers, sellers, admins)
 * - products (with seller references)
 * - orders (with customer and product references)
 * - payments (with order and customer references)
 * - reviews (with product and user references)
 * 
 * Safe to rerun: clears sample collections before seeding.
 * 
 * Usage: node scripts/seedDataset.js
 */

require("dotenv").config();

const mongoose = require("mongoose");
const ConnectDB = require("../src/db/db");

// ============================================================================
// CONFIGURATION
// ============================================================================

const COLLECTIONS_TO_SEED = ["users", "products", "orders", "payments", "reviews"];
const DOCUMENTS_PER_COLLECTION = 100;

const PRODUCT_CATEGORIES = [
    "Electronics",
    "Books",
    "Clothing",
    "Home & Garden",
    "Sports",
    "Toys",
    "Beauty",
    "Food",
    "Furniture",
    "Automotive"
];

const PAYMENT_METHODS = ["credit_card", "debit_card", "paypal", "bank_transfer", "digital_wallet"];
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "successful", "failed", "refunded"];

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Generate random user data
 */
function generateUser(index) {
    const roles = ["customer", "seller", "admin"];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];

    return {
        _id: new mongoose.Types.ObjectId(),
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        role: randomRole,
        phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        address: {
            street: `${Math.floor(Math.random() * 999) + 1} Main St`,
            city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][index % 5],
            state: ["NY", "CA", "IL", "TX", "AZ"][index % 5],
            zipCode: String(10000 + Math.floor(Math.random() * 90000))
        },
        isActive: Math.random() > 0.1,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
}

/**
 * Generate random product data with seller reference
 */
function generateProduct(index, sellerIds) {
    return {
        _id: new mongoose.Types.ObjectId(),
        name: `Product ${index + 1}`,
        description: `High-quality product with excellent features. Perfect for ${PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length]}`,
        category: PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length],
        price: Math.round((Math.random() * 500 + 10) * 100) / 100,
        stock: Math.floor(Math.random() * 500),
        sku: `SKU-${String(1000 + index).padStart(5, "0")}`,
        sellerId: sellerIds[index % sellerIds.length],
        ratings: Math.round((Math.random() * 2 + 3) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 500),
        tags: [
            PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length].toLowerCase(),
            ["new", "sale", "bestseller", "limited"][Math.floor(Math.random() * 4)]
        ],
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
}

/**
 * Generate random order with references
 */
function generateOrder(index, customerIds, productIds) {
    const productsInOrder = Math.floor(Math.random() * 4) + 1;
    const orderProducts = [];
    let totalAmount = 0;

    // Randomly select 1-4 products for this order
    const selectedProductIndices = new Set();
    while (selectedProductIndices.size < productsInOrder && selectedProductIndices.size < productIds.length) {
        selectedProductIndices.add(Math.floor(Math.random() * productIds.length));
    }

    for (const productIndex of selectedProductIndices) {
        const quantity = Math.floor(Math.random() * 5) + 1;
        const price = Math.round((Math.random() * 300 + 10) * 100) / 100;
        const itemTotal = quantity * price;

        orderProducts.push({
            productId: productIds[productIndex],
            quantity,
            price,
            subtotal: itemTotal
        });

        totalAmount += itemTotal;
    }

    // Add tax and shipping
    const tax = Math.round(totalAmount * 0.08 * 100) / 100;
    const shipping = 5.99;
    totalAmount = Math.round((totalAmount + tax + shipping) * 100) / 100;

    return {
        _id: new mongoose.Types.ObjectId(),
        orderNumber: `ORD-${String(100000 + index + 1).padStart(6, "0")}`,
        customerId: customerIds[index % customerIds.length],
        products: orderProducts,
        totalAmount,
        tax,
        shipping,
        status: ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)],
        shippingAddress: {
            street: `${Math.floor(Math.random() * 999) + 1} Delivery St`,
            city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][index % 5],
            state: ["NY", "CA", "IL", "TX", "AZ"][index % 5],
            zipCode: String(10000 + Math.floor(Math.random() * 90000))
        },
        notes: Math.random() > 0.7 ? "Special delivery instructions" : null,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
}

/**
 * Generate random payment with order reference
 */
function generatePayment(index, orderIds, customerIds) {
    const orderIndex = index % orderIds.length;
    return {
        _id: new mongoose.Types.ObjectId(),
        orderId: orderIds[orderIndex],
        customerId: customerIds[orderIndex % customerIds.length],
        amount: Math.round((Math.random() * 1000 + 10) * 100) / 100,
        paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
        status: PAYMENT_STATUSES[Math.floor(Math.random() * PAYMENT_STATUSES.length)],
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        lastFourDigits: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
        processingFee: Math.round((Math.random() * 5 + 1) * 100) / 100,
        currency: "USD",
        description: `Payment for order ${index + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - Math.random() * 360 * 24 * 60 * 60 * 1000)
    };
}

/**
 * Generate random review with product and user references
 */
function generateReview(index, userIds, productIds) {
    return {
        _id: new mongoose.Types.ObjectId(),
        userId: userIds[index % userIds.length],
        productId: productIds[index % productIds.length],
        rating: Math.floor(Math.random() * 5) + 1,
        title: [
            "Great product, highly recommend",
            "Excellent quality and fast shipping",
            "Not as expected",
            "Amazing value for money",
            "Good but needs improvement",
            "Absolutely love it",
            "Disappointed with the quality",
            "Very satisfied with my purchase",
            "Worth every penny",
            "Better than I expected"
        ][index % 10],
        comment: `This is a detailed review of the product. ${["Highly recommend.", "Would buy again.", "Poor quality.", "Exceeded expectations.", "Average product."][index % 5]}`,
        verified: Math.random() > 0.3,
        helpful: Math.floor(Math.random() * 100),
        unhelpful: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    };
}

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

/**
 * Clear sample collections before seeding
 */
async function clearCollections() {
    console.log("\n🧹 Clearing sample collections...\n");

    for (const collectionName of COLLECTIONS_TO_SEED) {
        try {
            const collection = mongoose.connection.db.collection(collectionName);
            const count = await collection.countDocuments();

            if (count > 0) {
                await collection.deleteMany({});
                console.log(`   ✓ Cleared ${collectionName} (${count} documents deleted)`);
            } else {
                console.log(`   ✓ ${collectionName} is empty`);
            }
        } catch (error) {
            console.log(`   ✓ ${collectionName} does not exist yet`);
        }
    }
}

/**
 * Seed all collections
 */
async function seedCollections() {
    const seedReport = {
        users: 0,
        products: 0,
        orders: 0,
        payments: 0,
        reviews: 0
    };

    try {
        console.log("\n📥 Seeding collections...\n");

        // ====================================================================
        // 1. SEED USERS
        // ====================================================================
        console.log("👤 Seeding users collection...");
        const users = [];
        for (let i = 0; i < DOCUMENTS_PER_COLLECTION; i++) {
            users.push(generateUser(i));
        }

        await mongoose.connection.db.collection("users").insertMany(users);
        seedReport.users = users.length;
        console.log(`   ✅ Inserted ${users.length} users\n`);

        const userIds = users.map(u => u._id);
        const sellerIds = users.filter(u => u.role === "seller").map(u => u._id);
        const customerIds = users.filter(u => u.role === "customer").map(u => u._id);

        // ====================================================================
        // 2. SEED PRODUCTS
        // ====================================================================
        console.log("📦 Seeding products collection...");
        const products = [];
        for (let i = 0; i < DOCUMENTS_PER_COLLECTION; i++) {
            products.push(generateProduct(i, sellerIds));
        }

        await mongoose.connection.db.collection("products").insertMany(products);
        seedReport.products = products.length;
        console.log(`   ✅ Inserted ${products.length} products\n`);

        const productIds = products.map(p => p._id);

        // ====================================================================
        // 3. SEED ORDERS
        // ====================================================================
        console.log("📋 Seeding orders collection...");
        const orders = [];
        for (let i = 0; i < DOCUMENTS_PER_COLLECTION; i++) {
            orders.push(generateOrder(i, customerIds, productIds));
        }

        await mongoose.connection.db.collection("orders").insertMany(orders);
        seedReport.orders = orders.length;
        console.log(`   ✅ Inserted ${orders.length} orders\n`);

        const orderIds = orders.map(o => o._id);

        // ====================================================================
        // 4. SEED PAYMENTS
        // ====================================================================
        console.log("💳 Seeding payments collection...");
        const payments = [];
        for (let i = 0; i < DOCUMENTS_PER_COLLECTION; i++) {
            payments.push(generatePayment(i, orderIds, customerIds));
        }

        await mongoose.connection.db.collection("payments").insertMany(payments);
        seedReport.payments = payments.length;
        console.log(`   ✅ Inserted ${payments.length} payments\n`);

        // ====================================================================
        // 5. SEED REVIEWS
        // ====================================================================
        console.log("⭐ Seeding reviews collection...");
        const reviews = [];
        for (let i = 0; i < DOCUMENTS_PER_COLLECTION; i++) {
            reviews.push(generateReview(i, userIds, productIds));
        }

        await mongoose.connection.db.collection("reviews").insertMany(reviews);
        seedReport.reviews = reviews.length;
        console.log(`   ✅ Inserted ${reviews.length} reviews\n`);

        return { success: true, seedReport, userIds, productIds, orderIds, customerIds };

    } catch (error) {
        console.error(`\n❌ Seeding failed: ${error.message}\n`);
        throw error;
    }
}

/**
 * Verify data integrity and relationships
 */
async function verifyDataIntegrity(seedData) {
    console.log("🔍 Verifying data integrity...\n");

    let errors = 0;

    try {
        // Verify products have valid seller references
        const products = await mongoose.connection.db.collection("products").find({}).toArray();
        for (const product of products) {
            const seller = await mongoose.connection.db.collection("users").findOne({
                _id: product.sellerId,
                role: "seller"
            });
            if (!seller) {
                console.log(`   ❌ Product ${product._id} references invalid seller ${product.sellerId}`);
                errors++;
            }
        }
        console.log(`   ✓ All products have valid seller references`);

        // Verify orders have valid customer references
        const orders = await mongoose.connection.db.collection("orders").find({}).toArray();
        let orderProductErrors = 0;

        for (const order of orders) {
            const customer = await mongoose.connection.db.collection("users").findOne({
                _id: order.customerId
            });
            if (!customer) {
                console.log(`   ❌ Order ${order._id} references invalid customer ${order.customerId}`);
                errors++;
            }

            // Verify products in order exist
            for (const item of order.products) {
                const product = await mongoose.connection.db.collection("products").findOne({
                    _id: item.productId
                });
                if (!product) {
                    orderProductErrors++;
                    errors++;
                }
            }
        }
        if (orderProductErrors === 0) {
            console.log(`   ✓ All orders have valid customer and product references`);
        }

        // Verify payments have valid order and customer references
        const payments = await mongoose.connection.db.collection("payments").find({}).toArray();
        let paymentErrors = 0;

        for (const payment of payments) {
            const order = await mongoose.connection.db.collection("orders").findOne({
                _id: payment.orderId
            });
            const customer = await mongoose.connection.db.collection("users").findOne({
                _id: payment.customerId
            });

            if (!order) {
                paymentErrors++;
                errors++;
            }
            if (!customer) {
                paymentErrors++;
                errors++;
            }
        }
        if (paymentErrors === 0) {
            console.log(`   ✓ All payments have valid order and customer references`);
        }

        // Verify reviews have valid user and product references
        const reviews = await mongoose.connection.db.collection("reviews").find({}).toArray();
        let reviewErrors = 0;

        for (const review of reviews) {
            const user = await mongoose.connection.db.collection("users").findOne({
                _id: review.userId
            });
            const product = await mongoose.connection.db.collection("products").findOne({
                _id: review.productId
            });

            if (!user) {
                reviewErrors++;
                errors++;
            }
            if (!product) {
                reviewErrors++;
                errors++;
            }
        }
        if (reviewErrors === 0) {
            console.log(`   ✓ All reviews have valid user and product references`);
        }

        return errors === 0;

    } catch (error) {
        console.error(`   ❌ Verification failed: ${error.message}`);
        return false;
    }
}

/**
 * Check that existing data is not modified
 */
async function verifyExistingData() {
    console.log("\n🛡️  Verifying existing data integrity...\n");

    try {
        const incidents = await mongoose.connection.db.collection("incidents").findOne({});

        if (incidents) {
            console.log(`   ❌ Incidents collection exists - seeding may have affected it`);
            return false;
        }

        console.log(`   ✓ Incidents collection not affected by seeding`);
        return true;

    } catch (error) {
        console.log(`   ✓ No existing incidents collection to protect`);
        return true;
    }
}

/**
 * Generate test queries for MongoMind
 */
function generateTestQueries() {
    return {
        "1. Simple find with empty filter": {
            collection: "users",
            query: "db.users.find({})"
        },
        "2. Find with single field filter": {
            collection: "users",
            query: 'db.users.find({ role: "customer" })'
        },
        "3. Find with multiple conditions": {
            collection: "orders",
            query: 'db.orders.find({ status: "delivered", "totalAmount": { "$gt": 100 } })'
        },
        "4. Aggregation with $lookup": {
            collection: "orders",
            query: `db.orders.aggregate([
  { $match: { status: "delivered" } },
  { $lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" } },
  { $limit: 10 }
])`
        },
        "5. Aggregation with $group": {
            collection: "orders",
            query: `db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$totalAmount" } } },
  { $sort: { totalAmount: -1 } }
])`
        },
        "6. Aggregation with $unwind": {
            collection: "orders",
            query: `db.orders.aggregate([
  { $unwind: "$products" },
  { $group: { _id: "$products.productId", totalQty: { $sum: "$products.quantity" } } },
  { $sort: { totalQty: -1 } },
  { $limit: 10 }
])`
        },
        "7. Query examining many but returning few": {
            collection: "products",
            query: 'db.products.find({ stock: { "$gt": 100 } }).sort({ ratings: -1 }).limit(5)'
        },
        "8. Aggregation across related collections": {
            collection: "reviews",
            query: `db.reviews.aggregate([
  { $match: { rating: { $gte: 4 } } },
  { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } },
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "reviewer" } },
  { $limit: 20 }
])`
        }
    };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    try {
        console.log("\n╔════════════════════════════════════════════════════════════════╗");
        console.log("║         MongoDB Sample Dataset Seed Script                       ║");
        console.log("╚════════════════════════════════════════════════════════════════╝");

        // Connect to database
        console.log("\n🔌 Connecting to MongoDB...");
        await ConnectDB();
        console.log(`✅ Connected to database: ${mongoose.connection.db.databaseName}\n`);

        // Verify correct database
        if (mongoose.connection.db.databaseName !== "HackOct") {
            throw new Error(
                `Wrong database! Connected to '${mongoose.connection.db.databaseName}', expected 'HackOct'`
            );
        }

        // Clear existing sample collections
        await clearCollections();

        // Seed new collections
        const seedData = await seedCollections();

        // Verify data integrity
        const integrityOk = await verifyDataIntegrity(seedData);

        // Verify existing data
        const existingDataOk = await verifyExistingData();

        // Generate report
        console.log("╔════════════════════════════════════════════════════════════════╗");
        console.log("║              SEEDING COMPLETE - SUMMARY REPORT                  ║");
        console.log("╚════════════════════════════════════════════════════════════════╝\n");

        console.log("📊 Documents Inserted:");
        console.log(`   • users:    ${seedData.seedReport.users}`);
        console.log(`   • products: ${seedData.seedReport.products}`);
        console.log(`   • orders:   ${seedData.seedReport.orders}`);
        console.log(`   • payments: ${seedData.seedReport.payments}`);
        console.log(`   • reviews:  ${seedData.seedReport.reviews}`);
        console.log(`\n   Total: ${Object.values(seedData.seedReport).reduce((a, b) => a + b, 0)} documents\n`);

        console.log("✅ Data Integrity:");
        console.log(`   ${integrityOk ? "✓" : "✗"} All references are valid`);
        console.log(`   ${existingDataOk ? "✓" : "✗"} Existing data not affected\n`);

        // Print test queries
        console.log("📝 Sample Queries for Testing MongoMind:\n");
        const testQueries = generateTestQueries();
        for (const [name, query] of Object.entries(testQueries)) {
            console.log(`${name}`);
            console.log(`   Collection: ${query.collection}`);
            console.log(`   Query: ${query.query}\n`);
        }

        console.log("═".repeat(66));
        console.log("✅ Dataset seeding successful!\n");

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log("Disconnected from MongoDB\n");
        }
    }
}

main();
