const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const adminAuth = require("../middleware/adminAuth");

// ✅ ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ success: false, message: "Invalid admin credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid admin credentials" });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, message: "Admin Login Successful", token, role: admin.role });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ GET ALL USERS
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ GET ALL TRANSACTIONS
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ APPROVE WITHDRAWAL
router.post("/withdraw/approve", adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction || transaction.type !== "withdrawal" || transaction.status !== "pending") {
      return res.status(400).json({ success: false, message: "Invalid transaction" });
    }

    const user = await User.findOne({ userId: transaction.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.balance < transaction.amount) {
      return res.status(400).json({ success: false, message: "User has insufficient balance now" });
    }

    // Deduct user balance
    user.balance -= transaction.amount;
    await user.save();

    // Mark as approved
    transaction.status = "approved";
    await transaction.save();

    res.json({ success: true, message: "Withdrawal approved and balance deducted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ REJECT WITHDRAWAL
router.post("/withdraw/reject", adminAuth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction || transaction.type !== "withdrawal" || transaction.status !== "pending") {
      return res.status(400).json({ success: false, message: "Invalid transaction" });
    }

    // Mark as rejected, do NOT deduct balance
    transaction.status = "rejected";
    await transaction.save();

    res.json({ success: true, message: "Withdrawal rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
