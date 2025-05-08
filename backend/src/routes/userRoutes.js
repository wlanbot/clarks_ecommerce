const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// GET /api/users - Get all users
router.get("/allusers", userController.getAllUsers);

// POST /api/users/update - Update a user
router.post("/updateuser", userController.updateUser);

// POST /api/users/remove - Remove a user
router.post("/removeuser", userController.removeUser);

module.exports = router;