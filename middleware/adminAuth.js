const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the user is an admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    req.admin = admin; // Attach admin to request
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
