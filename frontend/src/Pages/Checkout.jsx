"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { ShopContext } from "../Context/ShopContext"
import { backend_url, currency } from "../App"
import "./CSS/Checkout.css"

const Checkout = () => {
  const { products, cartItems, getTotalCartAmount, selectedSizes, removeFromCart } = useContext(ShopContext)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
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
      navigate("/cart")
      return
    }

    fetchAddresses()
  }, [cartItems, navigate])

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("auth-token")

      setLoading(true)
      const response = await fetch(`${backend_url}/addresses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      })

      const data = await response.json()

      if (data.success) {
        setAddresses(data.addresses)

        // Seleccionar la dirección por defecto si existe
        const defaultAddress = data.addresses.find((addr) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddress(defaultAddress._id)
        } else if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]._id)
        }
      } else {
        alert(data.message || "Error al cargar direcciones")
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
      alert("Error al cargar direcciones. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddressChange = (e) => {
    setSelectedAddress(e.target.value)
  }

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value)
  }

  const processPayment = async () => {
    if (!selectedAddress) {
      alert("Por favor selecciona una dirección de envío")
      return
    }

    try {
      setProcessingPayment(true)
      const token = localStorage.getItem("auth-token")
      const customerId = localStorage.getItem('customer-id');
      const customerEmail = localStorage.getItem('customer-email');

      // Obtener información del usuario desde el token
      // En lugar de depender de localStorage para user-id y user-email,
      // vamos a obtener esta información del backend

      // Preparar los productos para la compra
      const items = []

      products.forEach((product) => {
        if (cartItems[product.id] > 0) {
          const quantity = cartItems[product.id]
          const size = selectedSizes[product.id]

          items.push({
            id: product.id.toString(),
            title: product.name,
            description: product.description || `${product.name} - Talla: ${size}`,
            quantity: quantity,
            unitPrice: product.new_price,
          })
        }
      })

      // Obtener la dirección seleccionada
      const address = addresses.find((addr) => addr._id === selectedAddress)

      // Crear el objeto de pago con el formato correcto
      const paymentData = {
        currency: "MXN",
        description: "Compra en Tienda Online",
        callbackUrl: `${window.location.origin}/payment/success`,
        provider: paymentMethod === "stripe" ? "STRIPE" : "MERCADO_PAGO",
        items,
        metadata: {
          addressId: selectedAddress,
          shippingAddress: {
            street: address.street,
            number: address.number,
            city: address.city,
            state: address.state,
            zipCode: address.postalCode,
            country: address.country,
          },
        },
      }

      // Enviar solicitud de pago
      // El backend debe extraer la información del usuario del token
      const response = await fetch(`${backend_url}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
          'x-customer-id': customerId,
          'x-customer-email': customerEmail,
        },
        body: JSON.stringify(paymentData),
      })

      const data = await response.json()

      if (response.ok && data.redirectUrl) {
        // Guardar el ID de la orden para referencia
        localStorage.setItem("current-order-id", data.paymentId)

        // Redirigir al usuario a la página de pago
        window.location.href = data.redirectUrl
      } else {
        throw new Error(data.message || "Error al procesar el pago")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Error al procesar el pago: " + error.message)
    } finally {
      setProcessingPayment(false)
    }
  }

  const goToAddresses = () => {
    navigate("/addresses")
  }

  if (loading) {
    return <div className="checkout-loading">Cargando información...</div>
  }

  return (
    <div className="checkout-container">
      <h1>Finalizar Compra</h1>

      <div className="checkout-content">
        <div className="checkout-left">
          <div className="checkout-section">
            <h2>Dirección de Envío</h2>

            {addresses.length === 0 ? (
              <div className="no-addresses">
                <p>No tienes direcciones guardadas.</p>
                <button onClick={goToAddresses} className="add-address-button">
                  Agregar Dirección
                </button>
              </div>
            ) : (
              <div className="address-selection">
                {addresses.map((address) => (
                  <div key={address._id} className="address-option">
                    <input
                      type="radio"
                      id={`address-${address._id}`}
                      name="shipping-address"
                      value={address._id}
                      checked={selectedAddress === address._id}
                      onChange={handleAddressChange}
                    />
                    <label htmlFor={`address-${address._id}`} className="address-label">
                      <div className="address-info">
                        <p>
                          <strong>
                            {address.street} {address.number}
                          </strong>
                          {address.isDefault && <span className="default-tag">Predeterminada</span>}
                        </p>
                        <p>
                          {address.city}, {address.state}, {address.postalCode}
                        </p>
                        <p>{address.country}</p>
                        {address.instructions && <p className="additional-info">{address.instructions}</p>}
                      </div>
                    </label>
                  </div>
                ))}

                <button onClick={goToAddresses} className="manage-addresses-button">
                  Administrar Direcciones
                </button>
              </div>
            )}
          </div>

          <div className="checkout-section">
            <h2>Método de Pago</h2>

            <div className="payment-methods">
              <div className="payment-option">
                <input
                  type="radio"
                  id="stripe"
                  name="payment-method"
                  value="stripe"
                  checked={paymentMethod === "stripe"}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="stripe" className="payment-label">
                  <div className="payment-logo stripe-logo">
                    <span>Stripe</span>
                  </div>
                  <span>Pago con tarjeta de crédito/débito</span>
                </label>
              </div>

              <div className="payment-option">
                <input
                  type="radio"
                  id="mercadopago"
                  name="payment-method"
                  value="mercadopago"
                  checked={paymentMethod === "mercadopago"}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="mercadopago" className="payment-label">
                  <div className="payment-logo mercadopago-logo">
                    <span>MercadoPago</span>
                  </div>
                  <span>Múltiples métodos de pago</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="checkout-right">
          <div className="order-summary">
            <h2>Resumen del Pedido</h2>

            <div className="order-items">
              {products &&
                products.map((product) => {
                  if (cartItems[product.id] > 0) {
                    return (
                      <div key={product.id} className="order-item">
                        <div className="item-image">
                          <img src={backend_url + product.image || "/placeholder.svg"} alt={product.name} />
                        </div>
                        <div className="item-details">
                          <h3>{product.name}</h3>
                          <p>Talla: {selectedSizes[product.id]}</p>
                          <p>Cantidad: {cartItems[product.id]}</p>
                          <p className="item-price">
                            {currency}
                            {product.new_price * cartItems[product.id]}
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                })}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>
                  {currency}
                  {getTotalCartAmount()}
                </span>
              </div>
              <div className="total-row">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
                <span>
                  {currency}
                  {getTotalCartAmount()}
                </span>
              </div>
            </div>

            <button
              onClick={processPayment}
              className="checkout-button"
              disabled={processingPayment || !selectedAddress || addresses.length === 0}
            >
              {processingPayment ? "Procesando..." : "Realizar Pago"}
            </button>

            <button onClick={() => navigate("/cart")} className="back-to-cart">
              Volver al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
