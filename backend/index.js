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
mongoose.connect("mongodb+srv://alanjoseruizc:qwerty123@cluster0.sytpa7l.mongodb.net/e-commerce");

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
  console.log("Añadir al carrito");
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Producto añadido al carrito");
})


//endpoint para quitar articulos del carrito
app.post('/removefromcart', fetchuser, async (req, res) => {
  console.log("Eliminar del carrito");
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] != 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Eliminado del carrito");
})


//cartdata del usuario
app.post('/getcart', fetchuser, async (req, res) => {
  console.log("Obtener datos del carrito");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);

})


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

//correr server
app.listen(port, (error) => {
  if (!error) console.log("Servidor corriendo en el puerto: " + port);
  else console.log("Error : ", error);
});