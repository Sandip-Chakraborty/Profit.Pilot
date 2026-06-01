const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 12);
    const newAdmin = new Admin({
      username: "admin",
      password: hashedPassword,
      role: "superadmin"
    });

    await newAdmin.save();
    console.log("Default admin created successfully! (Username: admin, Password: admin123)");
    process.exit();
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
    process.exit(1);
  });
