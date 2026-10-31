const mongoose = require("mongoose");

const schema = new mongoose.Schema({

    incidentId: {
        type: String,
        required: true,
        unique: true
    },

    databaseName: {
        type: String,
        default: "HackOct"
    },

    collectionName: String,

    query: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    operation: {
        type: String,
        enum: ["find", "insert", "update", "delete", "aggregate", "other"]
    },

    executionTime: Number,

    documentsExamined: Number,

    documentsReturned: Number,

    rootCause: String,

    severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
    },

    recommendation: {
        type: String,
        required: true
    },

    proposedChange: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },

    status: {
        type: String,
        enum: ["detected", "analyzing", "pending", "resolved", "failed"],
        default: "detected"
    },

    occurredAt: Date,

    resolvedAt: Date

}, {
    timestamps: true
});

const Incident = mongoose.model("Incident", schema);

module.exports = Incident;
