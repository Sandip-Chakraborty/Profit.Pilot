const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret_placeholder",
});

// ✅ GET RAZORPAY KEY
router.get("/key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder" });
});


// ✅ CREATE ORDER (Deposit)
router.post("/create-order", async (req, res) => {
  try {
    if (req.userId === "demo123") {
      return res.status(400).json({ success: false, message: "Demo account cannot add real money!" });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Could not create order" });
  }
});

// ✅ VERIFY PAYMENT (Deposit)
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "secret_placeholder";
    
    // Create signature to verify
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      // Find user and update balance
      const userId = req.user.userId; // injected by authMiddleware
      const user = await User.findOne({ userId });
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // We need to fetch the order from razorpay to know the amount, or pass it from frontend.
      // Better to fetch from Razorpay to prevent tampering, but for simplicity we'll fetch order details.
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const amountInRupees = order.amount / 100;

      user.balance += amountInRupees;
      await user.save();

      const newTx = new Transaction({
        userId: user.userId,
        type: "deposit",
        amount: amountInRupees,
        status: "approved",
        razorpayOrderId: razorpay_order_id
      });
      await newTx.save();

      res.json({ success: true, message: "Payment verified and balance updated", newBalance: user.balance });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// ✅ WITHDRAW FUNDS
router.post("/withdraw", async (req, res) => {
  try {
    if (req.userId === "demo123") {
      return res.status(400).json({ success: false, message: "Demo account cannot withdraw real money!" });
    }

    const { amount, bankDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    // Create pending transaction instead of deducting instantly
    const newTx = new Transaction({
      userId: user.userId,
      type: "withdrawal",
      amount: amount,
      status: "pending",
      bankDetails: bankDetails
    });
    await newTx.save();

    res.json({ 
      success: true, 
      message: "Withdrawal request submitted successfully! Pending Admin approval."
    });

  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ success: false, message: "Withdrawal request failed" });
  }
});

module.exports = router;
