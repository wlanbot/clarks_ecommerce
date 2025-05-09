const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

// GET /api/products - Get all products
router.get("/allproducts", productController.getAllProducts);

// GET /api/products/newcollections - Get new collections
router.get("/newcollections", productController.getNewCollections);

// GET /api/products/popularwomen - Get popular women's products
router.get("/popularinwomen", productController.getPopularWomen);

// POST /api/products/related - Get related products
router.post("/relatedproducts", productController.getRelatedProducts);

// POST /api/products/add - Add a new product
router.post("/addproduct", productController.addProduct);

// POST /api/products/remove - Remove a product
router.post("/removeproduct", productController.removeProduct);

// POST /api/products/update - Update a product
router.post("/updateproduct", productController.updateProduct);

// POST /api/products/updateall - Update all products with default sizes
router.post("/updateallproducts", productController.updateAllProducts);

// POST /api/products/upload - Upload product image
router.post("/upload", upload.single('product'), productController.uploadImage);

module.exports = router;