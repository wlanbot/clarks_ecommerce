const Address = require("../models/Address");
const User = require("../models/User");

/**
 * Add new shipping address
 */
exports.addAddress = async (req, res) => {
  try {
    console.log("Adding new address for user ID:", req.user.id);
    
    const { isDefault, ...addressData } = req.body;
    
    // Si la nueva dirección es default, quitar el default de las demás
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const address = new Address({
      userId: req.user.id,
      ...addressData,
      isDefault: isDefault || false
    });

    await address.save();

    // Si es la primera dirección del usuario, marcarla como default
    const userAddresses = await Address.find({ userId: req.user.id });
    if (userAddresses.length === 1) {
      await Address.findByIdAndUpdate(address._id, { isDefault: true });
    }

    console.log("Address added successfully:", address._id);
    res.json({
      success: true,
      message: "Dirección agregada correctamente",
      address
    });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({
      success: false,
      message: "Error al agregar la dirección"
    });
  }
};

/**
 * Get all user addresses
 */
exports.getAddresses = async (req, res) => {
  try {
    console.log("Getting addresses for user ID:", req.user.id);
    
    const addresses = await Address.find({ userId: req.user.id })
      .sort({ isDefault: -1, createdAt: -1 });

    console.log(`Found ${addresses.length} addresses`);
    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error("Error getting addresses:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las direcciones"
    });
  }
};

/**
 * Update an address
 */
exports.updateAddress = async (req, res) => {
  try {
    console.log(`Updating address ID: ${req.params.id} for user ID: ${req.user.id}`);
    
    const { isDefault, ...updateData } = req.body;
    
    // Verificar que la dirección pertenece al usuario
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Dirección no encontrada"
      });
    }

    // Si se está marcando como default, quitar el default de las demás
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      { ...updateData, isDefault, updatedAt: new Date() },
      { new: true }
    );

    console.log("Address updated successfully:", updatedAddress._id);
    res.json({
      success: true,
      message: "Dirección actualizada correctamente",
      address: updatedAddress
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la dirección"
    });
  }
};

/**
 * Delete an address
 */
exports.deleteAddress = async (req, res) => {
  try {
    console.log(`Deleting address ID: ${req.params.id} for user ID: ${req.user.id}`);
    
    // Verificar que la dirección pertenece al usuario
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Dirección no encontrada"
      });
    }

    await Address.findByIdAndDelete(req.params.id);

    // Si se eliminó la dirección default, asignar otra como default
    if (address.isDefault) {
      const remainingAddresses = await Address.find({ userId: req.user.id });
      if (remainingAddresses.length > 0) {
        await Address.findByIdAndUpdate(
          remainingAddresses[0]._id,
          { isDefault: true }
        );
      }
    }

    console.log("Address deleted successfully");
    res.json({
      success: true,
      message: "Dirección eliminada correctamente"
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la dirección"
    });
  }
};

/**
 * Set default address
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    console.log(`Setting address ID: ${req.params.id} as default for user ID: ${req.user.id}`);
    
    // Verificar que la dirección pertenece al usuario
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Dirección no encontrada"
      });
    }

    // Quitar el default de todas las direcciones del usuario
    await Address.updateMany(
      { userId: req.user.id, isDefault: true },
      { $set: { isDefault: false } }
    );

    // Establecer esta dirección como default
    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      { isDefault: true, updatedAt: new Date() },
      { new: true }
    );

    console.log("Default address set successfully");
    res.json({
      success: true,
      message: "Dirección principal actualizada",
      address: updatedAddress
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({
      success: false,
      message: "Error al establecer la dirección principal"
    });
  }
};