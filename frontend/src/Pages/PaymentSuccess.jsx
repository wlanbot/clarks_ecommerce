"use client"

import { useEffect, useState, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ShopContext } from "../Context/ShopContext"
import { backend_url, currency } from "../App";
import "./CSS/PaymentResult.css"

const PaymentSuccess = () => {
  const [orderDetails, setOrderDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { removeFromCart } = useContext(ShopContext)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Obtener el orderId de los parámetros de la URL o del localStorage
        const params = new URLSearchParams(location.search)
        const orderId = params.get("orderId") || localStorage.getItem("current-order-id")

        if (!orderId) {
          throw new Error("No se encontró el ID de la orden")
        }

        const token = localStorage.getItem("auth-token")
        if (!token) {
          navigate("/login")
          return
        }

        const response = await fetch(`${backend_url}/payments/${orderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        })

        const data = await response.json()

        if (response.ok) {
          setOrderDetails(data)

          // Limpiar el carrito después de una compra exitosa
          if (data.status === "APPROVED") {
            clearCart(data)
          }
        } else {
          throw new Error(data.message || "Error al obtener detalles de la orden")
        }
      } catch (error) {
        console.error("Error fetching order details:", error)
        setError(error.message || "Error al obtener detalles de la orden")
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [location.search, navigate, removeFromCart])

  const clearCart = (orderData) => {
    // Si hay productos en la metadata, limpiar esos productos específicos
    if (orderData.metadata && orderData.metadata.products) {
      orderData.metadata.products.forEach((product) => {
        removeFromCart(product.productId, true)
      })
    }

    // Limpiar el ID de la orden actual
    localStorage.removeItem("current-order-id")
  }

  const continueShopping = () => {
    navigate("/")
  }

  const viewOrders = () => {
    navigate("/orders")
  }

  if (loading) {
    return (
      <div className="payment-result loading">
        <div className="spinner"></div>
        <p>Verificando el estado de tu pago...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-result error">
        <div className="result-icon error-icon">❌</div>
        <h1>Ha ocurrido un error</h1>
        <p>{error}</p>
        <div className="result-actions">
          <button onClick={continueShopping} className="continue-button">
            Continuar Comprando
          </button>
          <button onClick={() => navigate("/cart")} className="view-cart-button">
            Ver Carrito
          </button>
        </div>
      </div>
    )
  }

  // Si el pago no está aprobado, mostrar mensaje de procesamiento
  if (orderDetails && orderDetails.status !== "APPROVED") {
    return (
      <div className="payment-result processing">
        <div className="result-icon processing-icon">⏳</div>
        <h1>Pago en Procesamiento</h1>
        <p>Tu pago está siendo procesado. Te notificaremos cuando se complete.</p>
        <p className="order-id">ID de Orden: {orderDetails.orderId}</p>
        <div className="result-actions">
          <button onClick={continueShopping} className="continue-button">
            Continuar Comprando
          </button>
          <button onClick={viewOrders} className="view-orders-button">
            Ver Mis Pedidos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-result success">
      <div className="result-icon success-icon">✅</div>
      <h1>¡Pago Exitoso!</h1>
      <p>Tu pedido ha sido procesado correctamente.</p>

      {orderDetails && (
        <>
          <p className="order-id">ID de Orden: {orderDetails.orderId}</p>
          <div className="order-summary">
            <h2>Resumen de la Compra</h2>
            <p className="total-amount">
              Total: {currency}
              {orderDetails.amount}
            </p>
            <p className="payment-date">
              Fecha: {new Date(orderDetails.createdAt).toLocaleDateString()}{" "}
              {new Date(orderDetails.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </>
      )}

      <div className="result-actions">
        <button onClick={continueShopping} className="continue-button">
          Continuar Comprando
        </button>
        <button onClick={viewOrders} className="view-orders-button">
          Ver Mis Pedidos
        </button>
      </div>
    </div>
  )
}

export default PaymentSuccess
