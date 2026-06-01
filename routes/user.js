const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.userId === "demo123") {
      return res.json({
        success: true,
        user: { userId: "DEMO001", username: "Demo User", mobile: "9999999999", balance: 1000000 }
      });
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User nahi mila!" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

module.exports = router;
