const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const authenticate = require("../middleware/auth");

// POST /api/addresses - Add new address
router.post("/", authenticate, addressController.addAddress);

// GET /api/addresses - Get all user addresses
router.get("/", authenticate, addressController.getAddresses);

// PUT /api/addresses/:id - Update an address
router.put("/:id", authenticate, addressController.updateAddress);

// DELETE /api/addresses/:id - Delete an address
router.delete("/:id", authenticate, addressController.deleteAddress);

// POST /api/addresses/:id/default - Set address as default
router.post("/:id/default", authenticate, addressController.setDefaultAddress);

module.exports = router;