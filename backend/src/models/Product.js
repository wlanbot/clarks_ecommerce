const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: true,
    unique: true
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  new_price: { 
    type: Number 
  },
  old_price: { 
    type: Number 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  avilable: { 
    type: Boolean, 
    default: true 
  },
  sizes: {
    type: [{
      size: { 
        type: String, 
        required: true, 
        enum: ['S', 'M', 'L', 'XL', 'XXL'] 
      },
      stock: { 
        type: Number, 
        required: true, 
        default: 0 
      }
    }],
    default: [
      { size: 'S', stock: 0 },
      { size: 'M', stock: 0 },
      { size: 'L', stock: 0 },
      { size: 'XL', stock: 0 },
      { size: 'XXL', stock: 0 }
    ],
    validate: {
      validator: function(sizes) {
        const allowedSizes = ['S', 'M', 'L', 'XL', 'XXL'];
        return sizes.every(size => allowedSizes.includes(size.size));
      },
      message: 'Solo se permiten las tallas S, M, L, XL y XXL'
    }
  }
});

module.exports = mongoose.model("Product", ProductSchema);