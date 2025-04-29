import React, { useContext } from "react";
import "./CartItems.css";
import remove_icon from "../Assets/cart_cross_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";

const CartItems = () => {
  const { products, cartItems, removeFromCart, getTotalCartAmount } = useContext(ShopContext);

  const handlePurchase = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('Por favor inicia sesión para realizar la compra');
      return;
    }

    // Preparar los productos para la compra
    const productsToPurchase = [];
    let total = 0;

    products.forEach((product) => {
      if (cartItems[product.id] > 0) {
        productsToPurchase.push({
          id: product.id,
          name: product.name,
          price: product.new_price,
          quantity: cartItems[product.id]
        });
        total += product.new_price * cartItems[product.id];
      }
    });

    try {
      const response = await fetch(`${backend_url}/registerpurchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify({ products: productsToPurchase, total })
      });

      if (response.ok) {
        alert('¡Compra realizada con éxito!');
        // Limpiar el carrito después de la compra exitosa
        productsToPurchase.forEach(product => {
          removeFromCart(product.id);
        });
      } else {
        const data = await response.json();
        alert(data.message || 'Error al realizar la compra');
      }
    } catch (error) {
      console.error('Error al realizar la compra:', error);
      alert('Error al realizar la compra');
    }
  };

  return (
    <div className="cartitems">
      <div className="cartitems-format-main">
        <p>Productos</p>
        <p>Título</p>
        <p>Precio</p>
        <p>Cantidad</p>
        <p>Total</p>
        <p>Remover</p>
      </div>
      <hr />
      {products && products.map((e) => {
        if (cartItems[e.id] > 0) {
          return (
            <div key={e.id}>
              <div className="cartitems-format cartitems-format-main">
                <img className="cartitems-product-icon" src={backend_url + e.image} alt="" />
                <p>{e.name}</p>
                <p>{currency}{e.new_price}</p>
                <button className='cartitems-quantity'>{cartItems[e.id]}</button>
                <p>{currency}{e.new_price * cartItems[e.id]}</p>
                <img className='cartitems-remove-icon' src={remove_icon} onClick={() => { removeFromCart(e.id) }} alt="" />
              </div>
              <hr />
            </div>
          );
        }
        return null;
      })}
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Total del Carrito</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>{currency}{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Costo de Envío</p>
              <p>Gratis</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>{currency}{getTotalCartAmount()}</h3>
            </div>
          </div>
          <button onClick={handlePurchase}>COMPRAR</button>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
