const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const authenticate = require("../middleware/auth");

// POST /api/purchase/register - Register a new purchase
router.post("/registerpurchase", authenticate, purchaseController.registerPurchase);

// POST /api/purchase/history - Get purchase history
router.post("/purchasehistory", authenticate, purchaseController.getPurchaseHistory);

module.exports = router;