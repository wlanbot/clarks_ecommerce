"use client"

import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./CSS/PaymentResult.css"

const PaymentFailure = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Limpiar el ID de la orden actual
    localStorage.removeItem("current-order-id")
  }, [])

  const getErrorMessage = () => {
    const params = new URLSearchParams(location.search)
    return params.get("error") || "Ha ocurrido un error durante el proceso de pago."
  }

  const continueShopping = () => {
    navigate("/")
  }

  const retryPayment = () => {
    navigate("/cart")
  }

  return (
    <div className="payment-result error">
      <div className="result-icon error-icon">❌</div>
      <h1>Pago Fallido</h1>
      <p>{getErrorMessage()}</p>
      <div className="result-actions">
        <button onClick={continueShopping} className="continue-button">
          Continuar Comprando
        </button>
        <button onClick={retryPayment} className="retry-button">
          Intentar de Nuevo
        </button>
      </div>
    </div>
  )
}

export default PaymentFailure
