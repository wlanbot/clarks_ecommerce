const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../../config/config");

/**
 * User login
 */
exports.login = async (req, res) => {
  try {
    console.log("Login attempt");
    
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    
    // Check if user exists and password matches
    if (!user || req.body.password !== user.password) {
      return res.status(400).json({ 
        success: false, 
        errors: "Credenciales inválidas" 
      });
    }
    
    // Create JWT payload
    const payload = {
      user: {
        id: user._id
      }
    };
    
    // Generate token
    const token = jwt.sign(payload, JWT_SECRET);
    
    console.log("Login successful for user ID:", user._id);
    res.json({ success: true, token });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      errors: "Error en el servidor" 
    });
  }
};

/**
 * User registration
 */
exports.signup = async (req, res) => {
  try {
    console.log("Registration attempt");
    
    // Check if email already exists
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      return res.status(400).json({ 
        success: false, 
        errors: "Ya existe un usuario registrado con ese correo." 
      });
    }
    
    // Initialize empty cart
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }
    
    // Create new user
    const user = new User({
      name: req.body.username,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    
    // Save user to DB
    await user.save();
    
    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };
    
    // Generate token
    const token = jwt.sign(payload, JWT_SECRET);
    
    console.log("Registration successful for user ID:", user.id);
    res.json({ success: true, token });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      errors: "Error en el servidor" 
    });
  }
};

/**
 * Get user data
 */
exports.getUserData = async (req, res) => {
  try {
    console.log("Getting user data for ID:", req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }
    
    res.json({
      success: true,
      name: user.name,
      email: user.email,
      date: user.date
    });
    
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener datos del usuario" 
    });
  }
};