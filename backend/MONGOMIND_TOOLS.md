# MongoMind Monitoring Tools - Quick Reference

## 🚀 Start MongoMind

```bash
cd /Users/nehashivolkar/Desktop/Hackoctober/backend
node server.js
```

## 📊 Available Monitoring Tools

### 1. monitor_slow_queries
**Ask:** "Check for slow queries"  
**Detects:** Queries > 1000ms  
**Returns:** Query details, execution time, efficiency ratio

### 2. monitor_bulk_operations
**Ask:** "Detect bulk operations" or "Check for large updates"  
**Detects:** Bulk inserts, updates, deletes  
**Returns:** Operation type, affected count, severity

### 3. monitor_database_connections
**Ask:** "Monitor database connections"  
**Detects:** Connection pool changes  
**Returns:** Current/previous count, abnormality flag

### 4. monitor_collection_activity
**Ask:** "Analyze collection activity"  
**Analyzes:** users, products, orders, payments, reviews  
**Returns:** Read/write counts, docs examined/returned per collection

### 5. monitor_index_changes
**Ask:** "Check if indexes changed"  
**Detects:** New or removed indexes  
**Returns:** Index modification events with timestamps

### 6. get_database_details
**Ask:** "Show database structure"  
**Shows:** Collections, document counts, indexes  
**Returns:** Complete database metadata

## 📋 Example Questions for MongoMind

```
"Show database structure"
"Analyze collection activity"
"Monitor database connections"
"Check for slow queries"
"Detect bulk operations"
"Check if indexes changed"
"What's the database health?"
"Show me read and write patterns"
"Are there any suspicious operations?"
"What needs optimization?"
```

## 🧪 Test Activity (MongoDB Shell)

### Generate Slow Query
```javascript
db.orders.aggregate([
  { $lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" } },
  { $unwind: "$products" },
  { $group: { _id: "$products.productId", count: { $sum: 1 } } }
])
```

### Generate Bulk Operation
```javascript
db.products.updateMany(
  { category: "Electronics" },
  { $set: { onSale: true } }
)
```

### Create Index
```javascript
db.orders.createIndex({ status: 1 })
```

### Drop Index
```javascript
db.reviews.dropIndex("rating_1")
```

## ⚙️ Configuration

Edit top of `index.js`:

```javascript
const SLOW_QUERY_THRESHOLD = 1000; // milliseconds
const CONNECTION_INCREASE_THRESHOLD = 5; // connections
const MONITORED_COLLECTIONS = ["users", "products", "orders", "payments", "reviews"];
```

## 🛡️ Enable MongoDB Profiling

**Required for slow query and activity monitoring:**

```javascript
db.setProfilingLevel(1, { slowms: 1000 })
```

Verify:
```javascript
db.getProfilingLevel()  // Should return: 1
```

## ✅ Monitoring Tips

1. **Enable profiling first** - Required for many tools
2. **Generate test activity** - Run queries before checking
3. **Ask clear questions** - "Check for slow queries" not "monitor stuff"
4. **Chain questions** - Build understanding progressively
5. **Review recommendations** - All require developer approval

## 📊 What Each Tool Returns

| Tool | Success | Failure |
|------|---------|---------|
| slow_queries | Array of slow queries | "Profiler not enabled" |
| bulk_operations | Array of bulk ops | "Profiler not enabled" |
| connections | Connection stats | Error message |
| collection_activity | Per-collection analysis | Partial results |
| index_changes | Array of changes | Error message |
| database_details | Full metadata | Connection error |

## 🎯 Typical Workflow

```
1. Start MongoMind: node server.js
2. Ask: "Show database structure"
3. Ask: "Analyze collection activity"
4. Ask: "Check for slow queries"
5. Ask: "Monitor database connections"
6. Ask: "Check if indexes changed"
7. Review recommendations
8. Ask for optimization details
```

## 📁 Files Modified

- `index.js` - Main implementation with all 5 tools

## 🔗 Other Related Files

- `scripts/seedDataset.js` - Generate test data
- `server.js` - Start with API server
- `.env` - Configuration (no changes needed)

## ✨ Status

✅ All 5 monitoring tools implemented  
✅ Gemma 4 integration complete  
✅ Testing framework provided  
✅ Documentation complete  
✅ Ready for production use  

**Next Command:** `node server.js`
