const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT } = require("../config/config");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const addressRoutes = require('./routes/addressRoutes');

// Import database connection
const connectDB = require("../config/db");

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/', authRoutes);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Gateway API',
      version: '1.0.0',
      description: 'Documentación de la API de pagos'
    },
    servers: [
      {
        url: `http://localhost:${PORT || 5000}`,
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      // securitySchemes: {
      //   BearerAuth: {
      //     type: 'http',
      //     scheme: 'bearer',
      //     bearerFormat: 'JWT'
      //   }
      // }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Static files
app.use('/images/', express.static(path.join(__dirname, 'upload/images')));

// Connect to DB
connectDB();

// Routes
app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", cartRoutes);
app.use("/", purchaseRoutes);
app.use("/", userRoutes);
app.use('/', paymentRoutes);
app.use("/", addressRoutes);

// Basic route for server test
app.get("/", (req, res) => {
  res.json({ message: "E-commerce API running" });
});

// Start server
app.listen(PORT, (error) => {
  if (!error) {
    console.log(`Server running on port: ${PORT}`);
    console.log("API endpoints available under /api/");
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  } else {
    console.log("Error starting server:", error);
  }
});