const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// conexion MongoDB
mongoose.connect("mongodb+srv://alanjoseruizc:qwerty123@cluster0.sytpa7l.mongodb.net/e-commerce")
  .then(() => console.log("Conexión a MongoDB establecida"))
  .catch(err => console.error("Error conectando a MongoDB:", err));

//imagenes 
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage: storage })
app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`
  })
})

// ruta para acceder a las imagenes
app.use('/images', express.static('upload/images'));

const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Token inválido" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Token inválido" });
  }
};


// Schema para crear un usuario
const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  purchaseHistory: [{
    products: [{
      productId: { type: Number },
      size: { type: String },
      quantity: { type: Number }
    }],
    total: { type: Number },
    date: { type: Date, default: Date.now }
  }],
  date: { type: Date, default: Date.now() },
});


// Schema para crear un producto
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number },
  old_price: { type: Number },
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true },
  sizes: [{
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 }
  }]
});


// test server del backend 
app.get("/", (req, res) => {
  res.send("Root");
});


// crear un endpoint para el login y la autenticacion del usuario
app.post('/login', async (req, res) => {
  console.log("Inicio de sesión");
  let success = false;
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      }
      success = true;
      console.log(user.id);
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success, token });
    }
    else {
      return res.status(400).json({ success: success, errors: "Datos inválidos" })
    }
  }
  else {
    return res.status(400).json({ success: success, errors: "Datos inválidos" })
  }
})


//endpoint para el registro de usuario
app.post('/signup', async (req, res) => {
  console.log("Registro");
  let success = false;
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: success, errors: "Ya existe un usuario registrado con ese correo." });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });
  await user.save();
  const data = {
    user: {
      id: user.id
    }
  }

  const token = jwt.sign(data, 'secret_ecom');
  success = true;
  res.json({ success, token })
})


// endpoint para obtener los productos
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("Todos los productos");
  res.send(products);
});


// endpoint para productos recientes
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let arr = products.slice(0).slice(-8);
  console.log("Colecciones recientes");
  res.send(arr);
});


// endpoint para productos de mujer
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  let arr = products.splice(0, 4);
  console.log("Popular en mujeres");
  res.send(arr);
});

app.post("/relatedproducts", async (req, res) => {
  console.log("Productos relacionados");
  const {category} = req.body;
  const products = await Product.find({ category });
  const arr = products.slice(0, 4);
  res.send(arr);
});


//endpoint para guardar articulos en el carrito
app.post('/addtocart', fetchuser, async (req, res) => {
  try {
    console.log("Añadiendo al carrito:", req.body);
    let userData = await Users.findOne({ _id: req.user.id });
    
    if (!userData.cartData) {
      userData.cartData = {};
    }
    
    const { itemId, size } = req.body;
    const cartKey = `${itemId}-${size}`;
    
    if (!userData.cartData[cartKey]) {
      userData.cartData[cartKey] = { quantity: 0, size: size };
    }
    
    userData.cartData[cartKey].quantity += 1;
    await Users.findOneAndUpdate(
      { _id: req.user.id },
      { cartData: userData.cartData },
      { new: true }
    );
    res.json({ success: true, message: "Producto añadido al carrito" });
  } catch (error) {
    console.error("Error al añadir al carrito:", error);
    res.status(500).json({ success: false, message: "Error al añadir al carrito" });
  }
});


//endpoint para quitar articulos del carrito
app.post('/removefromcart', fetchuser, async (req, res) => {
  try {
    console.log("Eliminando del carrito:", req.body);
    let userData = await Users.findOne({ _id: req.user.id });
    
    if (!userData.cartData) {
      userData.cartData = {};
    }
    
    const { itemId, size } = req.body;
    const cartKey = `${itemId}-${size}`;
    
    if (userData.cartData[cartKey] && userData.cartData[cartKey].quantity > 0) {
      userData.cartData[cartKey].quantity -= 1;
      if (userData.cartData[cartKey].quantity === 0) {
        delete userData.cartData[cartKey];
      }
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        { cartData: userData.cartData },
        { new: true }
      );
      res.json({ success: true, message: "Producto eliminado del carrito" });
    } else {
      res.json({ success: false, message: "No hay más productos para eliminar" });
    }
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    res.status(500).json({ success: false, message: "Error al eliminar del carrito" });
  }
});


//cartdata del usuario
app.post('/getcart', fetchuser, async (req, res) => {
  try {
    console.log("Obteniendo carrito del usuario:", req.user.id);
    let userData = await Users.findOne({ _id: req.user.id });
    
    if (!userData.cartData) {
      userData.cartData = {};
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        { cartData: {} },
        { new: true }
      );
    }
    
    res.json(userData.cartData);
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({ success: false, message: "Error al obtener carrito" });
  }
});


//endpoint para agregar articulos desde el admin panel
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  }
  else { id = 1; }
  const product = new Product({
    id: id,
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  await product.save();
  console.log("Producto guardado");
  res.json({ success: true, name: req.body.name })
});


//endpoint para quitar articulos desde el admin panel
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Producto eliminado");
  res.json({ success: true, name: req.body.name })
});

//endpoint para actualizar productos
app.post("/updateproduct", async (req, res) => {
  console.log("Solicitud de actualización recibida en /updateproduct");
  console.log("Datos recibidos:", req.body);
  
  const { id, name, new_price, old_price, sizes } = req.body;
  
  try {
    // Verificar que todos los campos necesarios estén presentes
    if (!id || !name || new_price === undefined || old_price === undefined) {
      console.log("Faltan campos requeridos:", { id, name, new_price, old_price });
      return res.status(400).json({ 
        success: false, 
        message: "Faltan campos requeridos",
        received: { id, name, new_price, old_price }
      });
    }

    // Convertir los precios a números
    const parsedNewPrice = parseFloat(new_price);
    const parsedOldPrice = parseFloat(old_price);

    console.log("Buscando producto con id:", id);
    const product = await Product.findOne({ id: id });
    
    if (!product) {
      console.log("Producto no encontrado con id:", id);
      return res.status(404).json({ 
        success: false, 
        message: "Producto no encontrado",
        id: id 
      });
    }

    console.log("Producto encontrado:", product);
    console.log("Actualizando con nuevos valores:", {
      name,
      new_price: parsedNewPrice,
      old_price: parsedOldPrice,
      sizes
    });

    // Actualizar el producto
    product.name = name;
    product.new_price = parsedNewPrice;
    product.old_price = parsedOldPrice;
    if (sizes) {
      product.sizes = sizes;
    }
    
    const updatedProduct = await product.save();
    console.log("Producto actualizado exitosamente:", updatedProduct);

    res.json({ 
      success: true, 
      message: "Producto actualizado correctamente", 
      product: updatedProduct 
    });
  } catch (error) {
    console.log("Error detallado al actualizar producto:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar el producto", 
      error: error.message,
      stack: error.stack
    });
  }
});

//endpoint para obtener todos los usuarios
app.get("/allusers", async (req, res) => {
  try {
    console.log("Obteniendo todos los usuarios");
    const users = await Users.find({}, { password: 0 }); // Excluir la contraseña
    console.log("Usuarios encontrados:", users.length);
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener usuarios",
      error: error.message 
    });
  }
});

//endpoint para actualizar usuarios
app.post("/updateuser", async (req, res) => {
  console.log("Solicitud de actualización de usuario recibida");
  console.log("Datos recibidos:", req.body);
  
  const { _id, name, email } = req.body;
  
  try {
    if (!_id || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltan campos requeridos" 
      });
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await Users.findOne({ 
      email: email, 
      _id: { $ne: _id } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "El correo electrónico ya está en uso por otro usuario" 
      });
    }

    const updatedUser = await Users.findByIdAndUpdate(
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

    console.log("Usuario actualizado exitosamente:", updatedUser);
    res.json({ 
      success: true, 
      message: "Usuario actualizado correctamente", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al actualizar el usuario", 
      error: error.message 
    });
  }
});

//endpoint para eliminar usuarios
app.post("/removeuser", async (req, res) => {
  const { _id } = req.body;
  
  try {
    console.log("Intentando eliminar usuario con ID:", _id);
    const deletedUser = await Users.findByIdAndDelete(_id);
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    console.log("Usuario eliminado exitosamente");
    res.json({ 
      success: true, 
      message: "Usuario eliminado correctamente" 
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al eliminar el usuario", 
      error: error.message 
    });
  }
});

//endpoint para obtener el historial de compras del usuario
app.post('/purchasehistory', fetchuser, async (req, res) => {
  try {
    console.log("Obteniendo historial de compras");
    const user = await Users.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    // Obtener detalles completos de los productos
    const purchaseHistoryWithDetails = await Promise.all(
      user.purchaseHistory.map(async (purchase) => {
        const productsWithDetails = await Promise.all(
          purchase.products.map(async (item) => {
            const product = await Product.findOne({ id: item.productId });
            return {
              ...item,
              productDetails: product ? {
                name: product.name,
                image: product.image,
                price: product.new_price
              } : null
            };
          })
        );
        return {
          ...purchase,
          products: productsWithDetails
        };
      })
    );

    res.json({ 
      success: true, 
      purchaseHistory: purchaseHistoryWithDetails 
    });
  } catch (error) {
    console.error("Error al obtener historial de compras:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener el historial de compras",
      error: error.message 
    });
  }
});

//endpoint para registrar una compra
app.post('/registerpurchase', fetchuser, async (req, res) => {
  try {
    console.log("=== Iniciando registro de compra ===");
    console.log("Datos recibidos:", JSON.stringify(req.body, null, 2));
    
    const { products, total } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log("Error: No hay productos en la compra");
      return res.status(400).json({ success: false, message: "No hay productos en la compra" });
    }

    const user = await Users.findOne({ _id: req.user.id });
    if (!user) {
      console.log("Error: Usuario no encontrado");
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Verificar stock y actualizar
    for (const item of products) {
      console.log(`\nProcesando producto: ${item.name} (ID: ${item.id})`);
      console.log(`Talla: ${item.size}, Cantidad: ${item.quantity}`);

      const product = await Product.findOne({ id: item.id });
      if (!product) {
        console.log(`Error: Producto no encontrado - ID: ${item.id}`);
        return res.status(404).json({ success: false, message: `Producto no encontrado: ${item.name}` });
      }

      console.log("Producto encontrado:", {
        nombre: product.name,
        stockActual: product.sizes
      });

      const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
      if (sizeIndex === -1) {
        console.log(`Error: Talla no encontrada - ${item.size}`);
        return res.status(400).json({ success: false, message: `Talla no encontrada: ${item.size}` });
      }

      if (product.sizes[sizeIndex].stock < item.quantity) {
        console.log(`Error: Stock insuficiente - Disponible: ${product.sizes[sizeIndex].stock}, Requerido: ${item.quantity}`);
        return res.status(400).json({ 
          success: false, 
          message: `No hay suficiente stock para ${product.name} en talla ${item.size}. Stock disponible: ${product.sizes[sizeIndex].stock}` 
        });
      }

      // Actualizar el stock
      const updateQuery = {
        id: item.id,
        "sizes.size": item.size
      };
      
      const updateOperation = {
        $inc: { "sizes.$.stock": -item.quantity }
      };

      console.log("Query de actualización:", JSON.stringify(updateQuery, null, 2));
      console.log("Operación de actualización:", JSON.stringify(updateOperation, null, 2));

      const updatedProduct = await Product.findOneAndUpdate(
        updateQuery,
        updateOperation,
        { new: true }
      );

      if (!updatedProduct) {
        console.log("Error: No se pudo actualizar el producto");
        return res.status(500).json({ success: false, message: "Error al actualizar el stock" });
      }

      console.log(`Stock actualizado exitosamente para ${product.name}`);
      console.log(`Nuevo stock para talla ${item.size}: ${updatedProduct.sizes.find(s => s.size === item.size).stock}`);
    }

    // Crear el objeto de compra
    const purchase = {
      products: products.map(item => ({
        productId: item.id,
        size: item.size,
        quantity: item.quantity
      })),
      total: total,
      date: new Date()
    };

    console.log("\nRegistrando compra en el historial del usuario");
    user.purchaseHistory.push(purchase);
    await user.save();

    console.log("Limpiando carrito");
    user.cartData = {};
    await user.save();

    console.log("=== Compra registrada exitosamente ===");
    res.json({ success: true, message: "Compra registrada exitosamente" });
  } catch (error) {
    console.error("Error al registrar la compra:", error);
    res.status(500).json({ success: false, message: "Error al registrar la compra" });
  }
});

//endpoint para obtener datos del usuario
app.post('/userdata', fetchuser, async (req, res) => {
  try {
    console.log("Obteniendo datos del usuario:", req.user.id);
    const user = await Users.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    res.json({
      success: true,
      name: user.name,
      email: user.email,
      date: user.date
    });
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    res.status(500).json({ success: false, message: "Error al obtener datos del usuario" });
  }
});

//correr server
app.listen(port, (error) => {
  if (!error) {
    console.log("Servidor corriendo en el puerto: " + port);
    console.log("Rutas disponibles:");
    console.log("- POST /updateproduct");
    console.log("- GET /allproducts");
    console.log("- POST /addproduct");
    console.log("- POST /removeproduct");
  }
  else console.log("Error : ", error);
});