const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: String, // String to match User.userId
    required: true
  },
  type: {
    type: String,
    enum: ["deposit", "withdrawal"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  bankDetails: {
    type: String, // for withdrawals
    default: ""
  },
  razorpayOrderId: {
    type: String, // for deposits
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
