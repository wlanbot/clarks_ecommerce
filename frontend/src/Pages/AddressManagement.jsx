"use client"

import { useState, useEffect, useContext } from "react"
import "./CSS/AddressManagement.css"
import { ShopContext } from "../Context/ShopContext";

const AddressManagement = () => {
  const { userAddresses, addAddress, updateAddress, deleteAddress } = useContext(ShopContext)
  const [addresses, setAddresses] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentAddress, setCurrentAddress] = useState(null)
  const [formError, setFormError] = useState("")

  const [formData, setFormData] = useState({
    alias: "",
    recipientName: "",
    street: "",
    number: "",
    apartment: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: "México",
    phone: "",
    instructions: "",
    isDefault: false,
  })

  useEffect(() => {
    // In a real app, you would fetch addresses from an API
    setAddresses(userAddresses)
  }, [userAddresses])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const validateForm = () => {
    const requiredFields = [
      "alias",
      "recipientName",
      "street",
      "number",
      "neighborhood",
      "city",
      "state",
      "postalCode",
      "phone",
    ]

    for (const field of requiredFields) {
      if (!formData[field]) {
        setFormError(`El campo ${field} es obligatorio`)
        return false
      }
    }

    // Validate phone number format
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(formData.phone)) {
      setFormError("El número de teléfono debe tener 10 dígitos")
      return false
    }

    // Validate postal code format
    const postalCodeRegex = /^\d{5}$/
    if (!postalCodeRegex.test(formData.postalCode)) {
      setFormError("El código postal debe tener 5 dígitos")
      return false
    }

    setFormError("")
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      if (isEditing && currentAddress) {
        updateAddress(currentAddress.id, formData)
      } else {
        addAddress(formData)
      }

      // Reset form
      setFormData({
        alias: "",
        recipientName: "",
        street: "",
        number: "",
        apartment: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: "",
        country: "México",
        phone: "",
        instructions: "",
        isDefault: false,
      })
      setIsEditing(false)
      setCurrentAddress(null)
    } catch (error) {
      setFormError(`Error: ${error.message}`)
    }
  }

  const handleEdit = (address) => {
    setIsEditing(true)
    setCurrentAddress(address)
    setFormData({
      alias: address.alias || "",
      recipientName: address.recipientName || "",
      street: address.street || "",
      number: address.number || "",
      apartment: address.apartment || "",
      neighborhood: address.neighborhood || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "México",
      phone: address.phone || "",
      instructions: address.instructions || "",
      isDefault: address.isDefault || false,
    })
  }

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta dirección?")) {
      deleteAddress(id)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setCurrentAddress(null)
    setFormData({
      alias: "",
      recipientName: "",
      street: "",
      number: "",
      apartment: "",
      neighborhood: "",
      city: "",
      state: "",
      postalCode: "",
      country: "México",
      phone: "",
      instructions: "",
      isDefault: false,
    })
    setFormError("")
  }

  return (
    <div className="address-management">
      <h2>{isEditing ? "Editar Dirección" : "Agregar Nueva Dirección"}</h2>

      {formError && <div className="error-message">{formError}</div>}

      <form onSubmit={handleSubmit} className="address-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="alias">Alias (ej. Casa, Trabajo) *</label>
            <input type="text" id="alias" name="alias" value={formData.alias} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="recipientName">Nombre del Destinatario *</label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="street">Calle *</label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="number">Número *</label>
            <input
              type="text"
              id="number"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="apartment">Apartamento/Interior (opcional)</label>
            <input
              type="text"
              id="apartment"
              name="apartment"
              value={formData.apartment}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="neighborhood">Colonia *</label>
            <input
              type="text"
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">Ciudad *</label>
            <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="state">Estado *</label>
            <input type="text" id="state" name="state" value={formData.state} onChange={handleInputChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="postalCode">Código Postal *</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              required
              pattern="\d{5}"
              title="El código postal debe tener 5 dígitos"
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">País *</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              pattern="\d{10}"
              title="El número de teléfono debe tener 10 dígitos"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="instructions">Instrucciones de entrega (opcional)</label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows="3"
          ></textarea>
        </div>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleInputChange}
          />
          <label htmlFor="isDefault">Establecer como dirección predeterminada</label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isEditing ? "Actualizar Dirección" : "Agregar Dirección"}
          </button>
          {isEditing && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="address-list">
        <h2>Mis Direcciones</h2>
        {addresses.length === 0 ? (
          <p>No tienes direcciones guardadas.</p>
        ) : (
          addresses.map((address) => (
            <div key={address.id} className={`address-card ${address.isDefault ? "default" : ""}`}>
              {address.isDefault && <span className="default-badge">Predeterminada</span>}
              <h3>{address.alias}</h3>
              <p>
                <strong>Destinatario:</strong> {address.recipientName}
              </p>
              <p>
                {address.street} {address.number}
                {address.apartment && `, Int. ${address.apartment}`}
              </p>
              <p>Col. {address.neighborhood}</p>
              <p>
                {address.city}, {address.state}, {address.postalCode}
              </p>
              <p>{address.country}</p>
              <p>
                <strong>Teléfono:</strong> {address.phone}
              </p>
              {address.instructions && (
                <p>
                  <strong>Instrucciones:</strong> {address.instructions}
                </p>
              )}
              <div className="address-actions">
                <button onClick={() => handleEdit(address)} className="btn-edit">
                  Editar
                </button>
                <button onClick={() => handleDelete(address.id)} className="btn-delete">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AddressManagement
