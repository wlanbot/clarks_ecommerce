const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/auth");

// POST /api/auth/login - User login
router.post("/login", authController.login);

// POST /api/auth/signup - User registration
router.post("/signup", authController.signup);

// POST /api/auth/userdata - Get authenticated user data
router.post("/userdata", authenticate, authController.getUserData);

module.exports = router;