import React, { useContext } from "react";
import "./CartItems.css";
import remove_icon from "../Assets/cart_cross_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";
import { useNavigate } from "react-router-dom"

const CartItems = () => {
  const { products, cartItems, removeFromCart, getTotalCartAmount, selectedSizes } = useContext(ShopContext)
  const navigate = useNavigate()

  const handlePurchase = () => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      alert("Por favor inicia sesión para realizar la compra")
      navigate("/login")
      return
    }

    // Verificar si hay productos en el carrito
    let hasProducts = false
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        hasProducts = true
        break
      }
    }

    if (!hasProducts) {
      alert("No hay productos en el carrito")
      return
    }

    // Verificar stock antes de proceder al checkout
    let stockValid = true
    products.forEach((product) => {
      if (cartItems[product.id] > 0) {
        const quantity = cartItems[product.id]
        const size = selectedSizes[product.id]

        const sizeData = product.sizes.find((s) => s.size === size)
        if (!sizeData || sizeData.stock < quantity) {
          alert(
            `No hay suficiente stock para ${product.name} en talla ${size}. Stock disponible: ${sizeData ? sizeData.stock : 0}`,
          )
          stockValid = false
          return
        }
      }
    })

    if (stockValid) {
      navigate("/checkout")
    }
  }

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
      {products &&
        products.map((e) => {
          if (cartItems[e.id] > 0) {
            return (
              <div key={e.id}>
                <div className="cartitems-format cartitems-format-main">
                  <img className="cartitems-product-icon" src={backend_url + e.image || "/placeholder.svg"} alt="" />
                  <p>
                    {e.name} - Talla: {selectedSizes[e.id]}
                  </p>
                  <p>
                    {currency}
                    {e.new_price}
                  </p>
                  <button className="cartitems-quantity">{cartItems[e.id]}</button>
                  <p>
                    {currency}
                    {e.new_price * cartItems[e.id]}
                  </p>
                  <img
                    className="cartitems-remove-icon"
                    src={remove_icon || "/placeholder.svg"}
                    onClick={() => {
                      removeFromCart(e.id)
                    }}
                    alt=""
                  />
                </div>
                <hr />
              </div>
            )
          }
          return null
        })}
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Total del Carrito</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>
                {currency}
                {getTotalCartAmount()}
              </p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Costo de Envío</p>
              <p>Gratis</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>
                {currency}
                {getTotalCartAmount()}
              </h3>
            </div>
          </div>
          <button onClick={handlePurchase}>PROCEDER AL PAGO</button>
        </div>
      </div>
    </div>
  )
}

export default CartItems
