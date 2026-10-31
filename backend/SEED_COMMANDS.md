# MongoDB Sample Dataset - Command Reference

## Quick Commands

### 1. Generate Sample Data (First Time)
```bash
cd /Users/nehashivolkar/Desktop/Hackoctober/backend
node scripts/seedDataset.js
```

**Output:**
- 500 documents created across 5 collections
- All references verified
- Summary report printed

**Time:** ~5 seconds

---

### 2. Regenerate Sample Data (Safe to Rerun)
```bash
node scripts/seedDataset.js
```

**What it does:**
- Clears the 5 sample collections
- Generates fresh random data
- Verifies all relationships
- Protects incidents collection

**When to use:**
- Testing bulk operations
- Creating fresh test scenario
- Resetting database state

---

### 3. Start MongoMind and API
```bash
node server.js
```

**Starts:**
- Express REST API on port 3000
- MongoMind interactive AI assistant
- Both in same terminal

**Type:**
- `exit` in MongoMind to quit
- Ctrl+C to stop everything

---

### 4. Query Verification
```bash
node -e "
const mongoose = require('mongoose');
const ConnectDB = require('./src/db/db');

async function check() {
  require('dotenv').config();
  await ConnectDB();
  
  const collections = ['users', 'products', 'orders', 'payments', 'reviews'];
  for (const c of collections) {
    const col = mongoose.connection.db.collection(c);
    const count = await col.countDocuments();
    console.log(\`\${c}: \${count} documents\`);
  }
  
  await mongoose.disconnect();
}
check();
" 2>&1 | grep -v "injected env"
```

---

## Sample MongoDB Queries

Run these in MongoDB shell or client after `node scripts/seedDataset.js`:

### Test 1: Basic Count
```javascript
db.users.countDocuments()
db.products.countDocuments()
db.orders.countDocuments()
db.payments.countDocuments()
db.reviews.countDocuments()
```

### Test 2: Find by Role
```javascript
db.users.find({ role: "customer" })
db.users.find({ role: "seller" })
db.users.find({ role: "admin" })
```

### Test 3: Find Orders by Status
```javascript
db.orders.find({ status: "delivered" })
db.orders.find({ status: "pending" })
db.orders.find({ status: "cancelled" })
```

### Test 4: Price Filtering
```javascript
db.products.find({ price: { $gt: 100 } })
db.orders.find({ totalAmount: { $gt: 500 } })
```

### Test 5: Join Query
```javascript
db.orders.aggregate([
  { $match: { status: "delivered" } },
  { $lookup: { 
      from: "users", 
      localField: "customerId", 
      foreignField: "_id", 
      as: "customer" 
  } },
  { $limit: 5 }
])
```

### Test 6: Grouping
```javascript
db.orders.aggregate([
  { $group: { 
      _id: "$status", 
      count: { $sum: 1 }, 
      total: { $sum: "$totalAmount" } 
  } }
])
```

### Test 7: Array Unwinding
```javascript
db.orders.aggregate([
  { $unwind: "$products" },
  { $group: { 
      _id: "$products.productId", 
      totalQty: { $sum: "$products.quantity" } 
  } },
  { $sort: { totalQty: -1 } },
  { $limit: 10 }
])
```

### Test 8: Complex Join
```javascript
db.reviews.aggregate([
  { $match: { rating: { $gte: 4 } } },
  { $lookup: { 
      from: "products", 
      localField: "productId", 
      foreignField: "_id", 
      as: "product" 
  } },
  { $lookup: { 
      from: "users", 
      localField: "userId", 
      foreignField: "_id", 
      as: "reviewer" 
  } },
  { $limit: 20 }
])
```

---

## File Locations

```
Backend Root:
├── scripts/
│   ├── seedDataset.js          ← Main seed script (RUN THIS)
│   └── importDatasets.js       ← (Optional large dataset importer)
├── src/
│   ├── db/db.js                ← Connection (reused)
│   ├── models/incident.model.js ← Protected (not touched)
│   └── ...
├── server.js                   ← Start with this
├── index.js                    ← MongoMind (spawned by server.js)
└── package.json
```

---

## Troubleshooting

### No data appearing?
```bash
# Verify connection
node -c scripts/seedDataset.js

# Run the script
node scripts/seedDataset.js

# Check MongoDB directly
mongo HackOct
> db.users.count()
```

### Want to clear sample data?
```bash
# Run seed script (automatically clears first)
node scripts/seedDataset.js
```

### Want to keep data but reset?
Sample collections are:
- users
- products
- orders
- payments
- reviews

Your protected collections:
- incidents (NEVER CLEARED)

### Memory/Performance issues?
Edit `DOCUMENTS_PER_COLLECTION` in `seedDataset.js`:

```javascript
// Change from:
const DOCUMENTS_PER_COLLECTION = 100;

// To smaller:
const DOCUMENTS_PER_COLLECTION = 10;

// Or larger:
const DOCUMENTS_PER_COLLECTION = 1000;
```

Then rerun: `node scripts/seedDataset.js`

---

## Data Summary

| Collection | Docs | Size | Purpose |
|-----------|------|------|---------|
| users | 100 | ~50KB | Reference base |
| products | 100 | ~60KB | Catalog |
| orders | 100 | ~80KB | Transactions |
| payments | 100 | ~70KB | Payment tracking |
| reviews | 100 | ~40KB | Ratings/comments |
| **TOTAL** | **500** | **~300KB** | E-commerce scenario |

---

## Success Indicators

✅ All these should be true after running `node scripts/seedDataset.js`:

- [ ] Script runs without errors
- [ ] 500 documents inserted message shown
- [ ] All 5 collections have 100 documents each
- [ ] Data integrity verification passes
- [ ] No warnings about missing references
- [ ] Incidents collection untouched
- [ ] Can query data immediately
- [ ] MongoMind can analyze queries

---

## Next Steps

1. **Run:** `node scripts/seedDataset.js`
2. **Wait:** ~5 seconds for completion
3. **Verify:** 500 documents inserted
4. **Start:** `node server.js`
5. **Ask:** MongoMind about the database
6. **Test:** Run sample queries
7. **Analyze:** Monitor with MongoMind

---

**Status: ✅ READY TO USE**

For detailed documentation, see the generated artifacts:
- MongoDB Sample Dataset - Complete Documentation
- Quick Start - Sample Dataset Ready
- MongoDB Sample Dataset - Complete Setup Report
