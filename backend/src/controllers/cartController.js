const User = require("../models/User");

/**
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
  try {
    console.log("Adding to cart:", req.body);
    
    // Find user
    let userData = await User.findById(req.user.id);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // Initialize cartData if it doesn't exist
    if (!userData.cartData) {
      userData.cartData = {};
    }
    
    // Extract item details
    const { itemId, size } = req.body;
    const cartKey = `${itemId}-${size}`;
    
    // Add or update item in cart
    if (!userData.cartData[cartKey]) {
      userData.cartData[cartKey] = { quantity: 0, size: size };
    }
    
    userData.cartData[cartKey].quantity += 1;
    
    // Save changes
    await User.findByIdAndUpdate(
      req.user.id,
      { cartData: userData.cartData },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: "Producto añadido al carrito" 
    });
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al añadir al carrito" 
    });
  }
};

/**
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    console.log("Removing from cart:", req.body);
    
    // Find user
    let userData = await User.findById(req.user.id);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // Initialize cartData if it doesn't exist
    if (!userData.cartData) {
      userData.cartData = {};
    }
    
    // Extract item details
    const { itemId, size } = req.body;
    const cartKey = `${itemId}-${size}`;
    
    // Remove item from cart
    if (userData.cartData[cartKey] && userData.cartData[cartKey].quantity > 0) {
      userData.cartData[cartKey].quantity -= 1;
      
      // Remove item completely if quantity is 0
      if (userData.cartData[cartKey].quantity === 0) {
        delete userData.cartData[cartKey];
      }
      
      // Save changes
      await User.findByIdAndUpdate(
        req.user.id,
        { cartData: userData.cartData },
        { new: true }
      );
      
      res.json({ 
        success: true, 
        message: "Producto eliminado del carrito" 
      });
    } else {
      res.json({ 
        success: false, 
        message: "No hay más productos para eliminar" 
      });
    }
    
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar del carrito" 
    });
  }
};

/**
 * Get cart data
 */
exports.getCart = async (req, res) => {
  try {
    console.log("Getting cart for user:", req.user.id);
    
    // Find user
    let userData = await User.findById(req.user.id);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    // Initialize cartData if it doesn't exist
    if (!userData.cartData) {
      userData.cartData = {};
      await User.findByIdAndUpdate(
        req.user.id,
        { cartData: {} },
        { new: true }
      );
    }
    
    res.json(userData.cartData);
    
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener carrito" 
    });
  }
};