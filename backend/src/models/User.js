const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  password: { 
    type: String,
    required: true
  },
  cartData: { 
    type: Object,
    default: {}
  },
  purchaseHistory: [{
    products: [{
      productId: { type: Number },
      size: { type: String },
      quantity: { type: Number }
    }],
    total: { type: Number },
    date: { type: Date, default: Date.now }
  }],
  date: { 
    type: Date, 
    default: Date.now 
  },
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }
});

module.exports = mongoose.model("Users", UserSchema);
