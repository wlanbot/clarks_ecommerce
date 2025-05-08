const User = require("../models/User");

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    console.log("Getting all users");
    
    // Find all users and exclude passwords
    const users = await User.find({}, { password: 0 });
    console.log("Users found:", users.length);
    
    res.json(users);
    
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: error.message
    });
  }
};

/**
 * Update a user
 */
exports.updateUser = async (req, res) => {
  try {
    console.log("User update request received");
    console.log("Received data:", req.body);
    
    const { _id, name, email } = req.body;
    
    // Validate required fields
    if (!_id || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos"
      });
    }
    
    // Check if email already exists for another user
    const existingUser = await User.findOne({ 
      email: email, 
      _id: { $ne: _id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "El correo electrónico ya está en uso por otro usuario" 
      });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { name, email },
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }
    
    console.log("User updated successfully:", updatedUser);
    res.json({ 
      success: true, 
      message: "Usuario actualizado correctamente", 
      user: updatedUser 
    });
    
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el usuario",
      error: error.message
    });
  }
};

/**
 * Remove a user
 */
exports.removeUser = async (req, res) => {
  try {
    const { _id } = req.body;
    
    console.log("Attempting to delete user with ID:", _id);
    const deletedUser = await User.findByIdAndDelete(_id);
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }
    
    console.log("User deleted successfully");
    res.json({ 
      success: true, 
      message: "Usuario eliminado correctamente" 
    });
    
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el usuario",
      error: error.message
    });
  }
};