import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProductDisplay.css";
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";

const ProductDisplay = () => {
  const { productId } = useParams();
  const { products, addToCart } = useContext(ShopContext);
  const [selectedSize, setSelectedSize] = useState(null);
  const [stockMessage, setStockMessage] = useState("");

  const product = products.find((e) => e.id === Number(productId));

  const handleSizeClick = (size) => {
    const sizeData = product.sizes.find(s => s.size === size);
    if (sizeData && sizeData.stock > 0) {
      setSelectedSize(size);
      setStockMessage(`Stock disponible: ${sizeData.stock}`);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Por favor selecciona una talla");
      return;
    }
    const sizeData = product.sizes.find(s => s.size === selectedSize);
    if (sizeData && sizeData.stock > 0) {
      addToCart(product.id, selectedSize);
    } else {
      alert("No hay stock disponible para esta talla");
    }
  };

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="productdisplay">
      <div className="productdisplay-left">
        <div className="productdisplay-img">
          <img className="productdisplay-main-img" src={backend_url + product.image} alt="" />
        </div>
      </div>
      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">
            {currency}{product.old_price}
          </div>
          <div className="productdisplay-right-price-new">
            {currency}{product.new_price}
          </div>
        </div>
        <div className="productdisplay-right-description">
          {product.description}
        </div>
        <div className="productdisplay-right-size">
          <h1>Tallas</h1>
          <div className="productdisplay-right-sizes">
            {allSizes.map((size) => {
              const sizeData = product.sizes.find(s => s.size === size);
              const isOutOfStock = !sizeData || sizeData.stock === 0;
              return (
                <div
                  key={size}
                  className={`size-option ${
                    selectedSize === size ? "selected" : ""
                  } ${isOutOfStock ? "out-of-stock" : ""}`}
                  onClick={() => handleSizeClick(size)}
                >
                  {size}
                </div>
              );
            })}
          </div>
        </div>
        {stockMessage && <p className="stock-message">{stockMessage}</p>}
        <button onClick={handleAddToCart}>AGREGAR AL CARRITO</button>
        <p className="productdisplay-right-category">
          <span>Categoría :</span> {product.category}
        </p>
      </div>
    </div>
  );
};

export default ProductDisplay;
