const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../config/config");

const authenticate = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({ success: false, errors: "Token inválido o ausente" });
  }
  
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, errors: "Token inválido" });
  }
};

module.exports = authenticate;

