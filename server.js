const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve Static Files
app.use(express.static(path.join(__dirname)));

// ✅ MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("./models/Admin");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

// ✅ POST handler for admin login page form submission
app.post(["/admin", "/admin/", "/admin/index.html"], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin in database
    const admin = await Admin.findOne({ username });
    let isMatch = false;
    if (admin) {
      isMatch = await bcrypt.compare(password, admin.password);
    }

    if (!admin || !isMatch) {
      // Login failed: read admin/index.html and inject error message
      const loginHtmlPath = path.join(__dirname, "admin", "index.html");
      if (fs.existsSync(loginHtmlPath)) {
        let html = fs.readFileSync(loginHtmlPath, "utf8");
        const errMsg = `<div style="color: red; text-align: center; margin-bottom: 15px; font-weight: bold;">Invalid Username or Password</div>`;
        html = html.replace('<div style="color: red;"></div>', errMsg);
        return res.send(html);
      } else {
        return res.status(400).send("Invalid credentials and login page not found.");
      }
    }

    // Login successful: generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Send a script that stores token in localStorage and redirects to /admin.html
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <script>
          localStorage.setItem('admin_token', '${token}');
          window.location.href = '/admin.html';
        </script>
      </head>
      <body>
        <p style="color: white; font-family: sans-serif; text-align: center; margin-top: 50px;">
          Login Successful! Redirecting to dashboard...
        </p>
      </body>
      </html>
    `;
    res.send(successHtml);
  } catch (error) {
    console.error("Admin Login Form POST Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


// ✅ Mock routes for full product compatibility
const authMiddleware = require("./middleware/auth");

// ✅ Payment routes
const paymentRoutes = require("./routes/payment");
app.use("/api/v1/payment", authMiddleware, paymentRoutes);


app.all("/api/v1/watchlist", authMiddleware, (req, res) => res.json({ success: true, watchlist: [] }));
app.all("/api/v1/onlywatchlist", authMiddleware, (req, res) => res.json({ success: true, watchlist: [] }));
app.all("/api/v1/tradeposition", authMiddleware, (req, res) => res.json({ success: true, positions: [] }));
app.all("/api/v1/chart", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/execution", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/ledger", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/get", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/Get", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/chat", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/addsltgt", authMiddleware, (req, res) => res.json({ success: true }));
app.all("/api/v1/limitmodify", authMiddleware, (req, res) => res.json({ success: true }));
app.all("/api/v1/marginsetting", authMiddleware, (req, res) => res.json({ success: true, data: {} }));
app.all("/api/v1/forgot", (req, res) => res.json({ success: true, message: "OTP sent!" }));
app.all("/api/v1/requestOTP", (req, res) => res.json({ success: true, message: "OTP sent!" }));
app.all("/api/v1/change", authMiddleware, (req, res) => res.json({ success: true }));
app.all("/api/v1/SubNotification", authMiddleware, (req, res) => res.json({ success: true }));
app.all("/api/v1/GetBkgExposure", authMiddleware, (req, res) => res.json({ success: true, data: {} }));
app.all("/api/v1/getLedgerReq", authMiddleware, (req, res) => res.json({ success: true, data: [] }));
app.all("/api/v1/getWithdrawalLimitInfo", authMiddleware, (req, res) => res.json({ success: true, data: {} }));
app.all("/api/v1/mytpipay", authMiddleware, (req, res) => res.json({ success: true, data: {} }));

// ✅ Catch all for Frontend Routing (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
