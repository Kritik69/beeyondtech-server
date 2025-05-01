// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  const userHeader = req.header("user");

  let user;
  if (userHeader) {
    try {
      user = JSON.parse(userHeader);
      console.log(user);
    } catch (error) {
      return res.status(400).json({ message: "Invalid user header format" });
    }
  }

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = decoded; // Attach the decoded user data to the request
    next();
  } catch (error) {
    res.status(400).json({ message: "Token Expired" });
  }
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  const userHeader = req.header("user");
  let user;
  if (userHeader) {
    try {
      user = JSON.parse(userHeader);
      console.log(user);
    } catch (error) {
      return res.status(400).json({ message: "Invalid user header format" });
    }
  }
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Access denied, not an admin" });
  }
  next();
};

module.exports = { authenticateJWT, isAdmin };
