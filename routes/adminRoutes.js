// routes/adminRoutes.js
const express = require("express");
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware");
const router = express.Router();

// Admin Dashboard Route
router.get("/dashboard", authenticateJWT, isAdmin, (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard" });
});

module.exports = router;
