const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authenticate = require("../middleware/auth");

// POST /api/cart/add - Add item to cart
router.post("/addtocart", authenticate, cartController.addToCart);

// POST /api/cart/remove - Remove item from cart
router.post("/removefromcart", authenticate, cartController.removeFromCart);

// POST /api/cart/get - Get cart data
router.post("/getcart", authenticate, cartController.getCart);

module.exports = router;