"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { backend_url, currency } from "../App";
import "./CSS/OrderHistory.css"

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [refundReason, setRefundReason] = useState("")
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [processingRefund, setProcessingRefund] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        navigate("/login")
        return
      }

      setLoading(true)
      const userId = localStorage.getItem("user-id")
      const response = await fetch(`${backend_url}/payments/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setOrders(data.data)
      } else {
        setError(data.message || "Error al cargar los pedidos")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Error al cargar los pedidos. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED":
        return { text: "Aprobado", class: "status-approved" }
      case "PENDING":
        return { text: "Pendiente", class: "status-pending" }
      case "REJECTED":
        return { text: "Rechazado", class: "status-rejected" }
      case "REFUNDED":
        return { text: "Reembolsado", class: "status-refunded" }
      case "CANCELLED":
        return { text: "Cancelado", class: "status-cancelled" }
      default:
        return { text: status, class: "status-unknown" }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
  }

  const closeOrderDetails = () => {
    setSelectedOrder(null)
  }

  const openRefundModal = () => {
    setShowRefundModal(true)
  }

  const closeRefundModal = () => {
    setShowRefundModal(false)
    setRefundReason("")
  }

  const handleRefundReasonChange = (e) => {
    setRefundReason(e.target.value)
  }

  const requestRefund = async () => {
    if (!refundReason.trim()) {
      alert("Por favor ingresa un motivo para el reembolso")
      return
    }

    try {
      setProcessingRefund(true)
      const token = localStorage.getItem("auth-token")

      const response = await fetch(`${backend_url}/payments/${selectedOrder.orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({
          reason: refundReason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Solicitud de reembolso enviada correctamente")
        closeRefundModal()
        fetchOrders() // Actualizar la lista de pedidos
      } else {
        throw new Error(data.message || "Error al solicitar el reembolso")
      }
    } catch (error) {
      console.error("Error requesting refund:", error)
      alert("Error al solicitar el reembolso: " + error.message)
    } finally {
      setProcessingRefund(false)
    }
  }

  const canRequestRefund = (order) => {
    // Solo se puede solicitar reembolso para pedidos aprobados
    if (order.status !== "APPROVED") {
      return false
    }

    // Verificar si han pasado menos de 14 días desde la compra
    const orderDate = new Date(order.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now - orderDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays <= 14
  }

  if (loading) {
    return <div className="orders-loading">Cargando pedidos...</div>
  }

  if (error) {
    return (
      <div className="orders-error">
        <p>{error}</p>
        <button onClick={fetchOrders} className="retry-button">
          Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
    <div className="order-history">
      <h1>Historial de Pedidos</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No tienes pedidos realizados.</p>
          <button onClick={() => navigate("/")} className="shop-now-button">
            Comprar Ahora
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const status = getStatusLabel(order.status)
            return (
              <div key={order.id} className="order-card" onClick={() => handleOrderClick(order)}>
                <div className="order-header">
                  <div className="order-id">
                    <span>Orden:</span> {order.orderId}
                  </div>
                  <div className={`order-status ${status.class}`}>{status.text}</div>
                </div>
                <div className="order-info">
                  <div className="order-date">
                    <span>Fecha:</span> {formatDate(order.createdAt)}
                  </div>
                  <div className="order-amount">
                    <span>Total:</span> {currency}
                    {order.amount}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de detalles del pedido */}
      {selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detalles del Pedido</h2>
              <button className="close-button" onClick={closeOrderDetails}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-details-header">
                <div className="order-id-large">
                  <span>ID de Orden:</span> {selectedOrder.orderId}
                </div>
                <div className={`order-status-large ${getStatusLabel(selectedOrder.status).class}`}>
                  {getStatusLabel(selectedOrder.status).text}
                </div>
              </div>

              <div className="order-details-info">
                <div className="info-row">
                  <span>Fecha:</span> {formatDate(selectedOrder.createdAt)}
                </div>
                <div className="info-row">
                  <span>Total:</span> {currency}
                  {selectedOrder.amount}
                </div>
                <div className="info-row">
                  <span>Método de Pago:</span> {selectedOrder.provider}
                </div>
              </div>

              {selectedOrder.metadata && selectedOrder.metadata.products && (
                <div className="order-products">
                  <h3>Productos</h3>
                  <div className="products-list">
                    {selectedOrder.metadata.products.map((product, index) => (
                      <div key={index} className="product-item">
                        <div className="product-info">
                          <p className="product-name">ID: {product.productId}</p>
                          <p className="product-details">
                            Talla: {product.size}, Cantidad: {product.quantity}
                          </p>
                          <p className="product-price">
                            {currency}
                            {product.unitPrice} x {product.quantity} = {currency}
                            {product.unitPrice * product.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.metadata && selectedOrder.metadata.shippingAddress && (
                <div className="shipping-address">
                  <h3>Dirección de Envío</h3>
                  <p>
                    {selectedOrder.metadata.shippingAddress.street} {selectedOrder.metadata.shippingAddress.number},
                    {selectedOrder.metadata.shippingAddress.city}, {selectedOrder.metadata.shippingAddress.state},
                    {selectedOrder.metadata.shippingAddress.zipCode}, {selectedOrder.metadata.shippingAddress.country}
                  </p>
                </div>
              )}

              {canRequestRefund(selectedOrder) && (
                <div className="refund-section">
                  <button onClick={openRefundModal} className="refund-button">
                    Solicitar Reembolso
                  </button>
                  <p className="refund-note">
                    * Puedes solicitar un reembolso dentro de los 14 días posteriores a la compra.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de solicitud de reembolso */}
      {showRefundModal && (
        <div className="refund-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Solicitar Reembolso</h2>
              <button className="close-button" onClick={closeRefundModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Por favor, indícanos el motivo de tu solicitud de reembolso:</p>

              <textarea
                className="refund-reason"
                value={refundReason}
                onChange={handleRefundReasonChange}
                placeholder="Escribe aquí el motivo de tu solicitud..."
                rows={5}
              ></textarea>

              <div className="refund-actions">
                <button onClick={requestRefund} className="confirm-refund-button" disabled={processingRefund}>
                  {processingRefund ? "Procesando..." : "Confirmar Solicitud"}
                </button>
                <button onClick={closeRefundModal} className="cancel-refund-button" disabled={processingRefund}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistory
