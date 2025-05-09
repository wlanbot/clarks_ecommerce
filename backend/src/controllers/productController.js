const Product = require("../models/Product");

/**
 * Get all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    console.log("Retrieved all products");
    res.json(products);
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener los productos" 
    });
  }
};

/**
 * Get new collections (latest 8 products)
 */
exports.getNewCollections = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ date: -1 }).limit(8);
    console.log("Retrieved new collections");
    res.json(products);
  } catch (error) {
    console.error("Error retrieving new collections:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener las nuevas colecciones" 
    });
  }
};

/**
 * Get popular women's products
 */
exports.getPopularWomen = async (req, res) => {
  try {
    const products = await Product.find({ category: "women" }).limit(4);
    console.log("Retrieved popular women's products");
    res.json(products);
  } catch (error) {
    console.error("Error retrieving women's products:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener los productos populares de mujer" 
    });
  }
};

/**
 * Get related products by category
 */
exports.getRelatedProducts = async (req, res) => {
  try {
    const { category } = req.body;
    const products = await Product.find({ category }).limit(4);
    console.log("Retrieved related products for category:", category);
    res.json(products);
  } catch (error) {
    console.error("Error retrieving related products:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener productos relacionados" 
    });
  }
};

/**
 * Add a new product
 */
exports.addProduct = async (req, res) => {
  try {
    // Get the latest product ID
    let products = await Product.find({});
    let id = 1;
    
    if (products.length > 0) {
      const lastProduct = products.reduce((latest, product) => 
        product.id > latest.id ? product : latest, products[0]);
      id = lastProduct.id + 1;
    }
    
    // Create new product
    const product = new Product({
      id: id,
      name: req.body.name,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      sizes: req.body.sizes || [
        { size: 'S', stock: 0 },
        { size: 'M', stock: 0 },
        { size: 'L', stock: 0 },
        { size: 'XL', stock: 0 },
        { size: 'XXL', stock: 0 }
      ]
    });
    
    await product.save();
    console.log("Product saved:", product.name);
    res.json({ success: true, name: req.body.name });
    
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al añadir el producto" 
    });
  }
};

/**
 * Remove a product
 */
exports.removeProduct = async (req, res) => {
  try {
    const result = await Product.findOneAndDelete({ id: req.body.id });
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: "Producto no encontrado" 
      });
    }
    
    console.log("Product removed:", req.body.name);
    res.json({ success: true, name: req.body.name });
    
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar el producto" 
    });
  }
};

/**
 * Update a product
 */
exports.updateProduct = async (req, res) => {
  try {
    console.log("Product update request received");
    const { id, name, new_price, old_price, sizes } = req.body;
    
    // Validate required fields
    if (!id || !name || new_price === undefined || old_price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }
    
    // Parse prices to numbers
    const parsedNewPrice = parseFloat(new_price);
    const parsedOldPrice = parseFloat(old_price);
    
    // Find product
    const product = await Product.findOne({ id: id });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Producto no encontrado"
      });
    }
    
    // Validate sizes if provided
    if (sizes) {
      const allowedSizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const validSizes = sizes.every(size => allowedSizes.includes(size.size));
      
      if (!validSizes) {
        return res.status(400).json({
          success: false,
          message: "Solo se permiten las tallas S, M, L, XL y XXL"
        });
      }
    }
    
    // Update product
    product.name = name;
    product.new_price = parsedNewPrice;
    product.old_price = parsedOldPrice;
    
    if (sizes) {
      product.sizes = sizes;
    }
    
    const updatedProduct = await product.save();
    console.log("Product updated:", updatedProduct.name);
    
    res.json({ 
      success: true, 
      message: "Producto actualizado correctamente", 
      product: updatedProduct 
    });
    
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el producto",
      error: error.message
    });
  }
};

/**
 * Update all products with default sizes
 */
exports.updateAllProducts = async (req, res) => {
  try {
    console.log("Starting bulk update of all products");
    
    const defaultSizes = [
      { size: 'S', stock: 0 },
      { size: 'M', stock: 0 },
      { size: 'L', stock: 0 },
      { size: 'XL', stock: 0 },
      { size: 'XXL', stock: 0 }
    ];
    
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);
    
    // Update each product
    for (const product of products) {
      // Preserve existing stock if it exists
      const updatedSizes = defaultSizes.map(defaultSize => {
        const existingSize = product.sizes?.find(s => s.size === defaultSize.size);
        return {
          size: defaultSize.size,
          stock: existingSize ? existingSize.stock : 0
        };
      });
      
      // Update the product
      await Product.findByIdAndUpdate(
        product._id,
        { $set: { sizes: updatedSizes } },
        { new: true }
      );
      
      console.log(`Product updated: ${product.name}`);
    }
    
    console.log("Bulk update completed successfully");
    res.json({ 
      success: true, 
      message: `Se actualizaron ${products.length} productos exitosamente` 
    });
    
  } catch (error) {
    console.error("Error updating all products:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar los productos",
      error: error.message
    });
  }
};

/**
 * Process uploaded product image
 */
exports.uploadImage = (req, res) => {
  try {
    res.json({
      success: 1,
      image_url: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al subir la imagen" 
    });
  }
};