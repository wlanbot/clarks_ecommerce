const User = require("../models/User");
const Product = require("../models/Product");

/**
 * Register a new purchase
 */
exports.registerPurchase = async (req, res) => {
  try {
    console.log("=== Starting purchase registration ===");
    console.log("Received data:", JSON.stringify(req.body, null, 2));
    
    const { products, total } = req.body;
    const userId = req.user.id;
    
    // Verify and update stock for each product
    for (const product of products) {
      console.log(`\nProcessing product: ${product.name} (ID: ${product.id})`);
      console.log(`Size: ${product.size}, Quantity: ${product.quantity}`);
      
      // Find product
      const productDoc = await Product.findOne({ id: product.id });
      if (!productDoc) {
        console.log(`Error: Product not found - ID: ${product.id}`);
        return res.status(404).json({ 
          success: false, 
          message: `Producto ${product.id} no encontrado` 
        });
      }
      
      // Find specific size
      const sizeIndex = productDoc.sizes.findIndex(s => s.size === product.size);
      if (sizeIndex === -1) {
        console.log(`Error: Size not found - ${product.size}`);
        return res.status(400).json({ 
          success: false, 
          message: `Talla ${product.size} no disponible para el producto ${product.id}` 
        });
      }
      
      // Check if enough stock
      if (productDoc.sizes[sizeIndex].stock < product.quantity) {
        console.log(`Error: Insufficient stock - Available: ${productDoc.sizes[sizeIndex].stock}, Required: ${product.quantity}`);
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuficiente para el producto ${productDoc.name} en talla ${product.size}. Stock disponible: ${productDoc.sizes[sizeIndex].stock}` 
        });
      }
      
      // Update stock
      console.log(`Current stock before purchase: ${productDoc.sizes[sizeIndex].stock}`);
      productDoc.sizes[sizeIndex].stock -= product.quantity;
      console.log(`Current stock after purchase: ${productDoc.sizes[sizeIndex].stock}`);
      
      // Save changes to product
      const updatedProduct = await productDoc.save();
      console.log(`Stock updated successfully for ${productDoc.name} in size ${product.size}`);
      console.log(`New stock: ${updatedProduct.sizes[sizeIndex].stock}`);
    }
    
    // Register purchase
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    const purchase = {
      products: products.map(item => ({
        productId: item.id,
        size: item.size,
        quantity: item.quantity
      })),
      total: total,
      date: new Date()
    };
    
    user.purchaseHistory.push(purchase);
    await user.save();
    
    console.log("=== Purchase registered successfully ===");
    res.json({ 
      success: true, 
      message: 'Compra registrada exitosamente' 
    });
    
  } catch (error) {
    console.error('Error registering purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar la compra' 
    });
  }
};

/**
 * Get purchase history
 */
exports.getPurchaseHistory = async (req, res) => {
  try {
    console.log("Getting purchase history");
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }
    
    // Get complete product details
    const purchaseHistoryWithDetails = await Promise.all(
      user.purchaseHistory.map(async (purchase) => {
        const productsWithDetails = await Promise.all(
          purchase.products.map(async (item) => {
            const product = await Product.findOne({ id: item.productId });
            return {
              productId: item.productId,
              size: item.size,
              quantity: item.quantity,
              productDetails: product ? {
                name: product.name,
                image: product.image,
                price: product.new_price
              } : null
            };
          })
        );
        
        return {
          date: purchase.date ? new Date(purchase.date).toISOString() : null,
          total: purchase.total || 0,
          products: productsWithDetails
        };
      })
    );
    
    // Sort purchases by date, newest first
    purchaseHistoryWithDetails.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log("Purchase history processed");
    
    res.json({ 
      success: true, 
      purchaseHistory: purchaseHistoryWithDetails 
    });
    
  } catch (error) {
    console.error("Error getting purchase history:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial de compras",
      error: error.message
    });
  }
};