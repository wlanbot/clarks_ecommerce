import React, { createContext, useEffect, useState } from "react";
import { backend_url } from "../App";

export const ShopContext = createContext(null)

const getDefaultCart = () => {
  const cart = {}
  for (let i = 0; i < 300; i++) {
    cart[i] = 0
  }
  return cart
}

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState([])
  const [cartItems, setCartItems] = useState(getDefaultCart())
  const [selectedSizes, setSelectedSizes] = useState({})
  const [loading, setLoading] = useState(true)
  const [userAddresses, setUserAddresses] = useState([])

  useEffect(() => {
    fetchProducts()

    if (localStorage.getItem("auth-token")) {
      fetchCart()
      fetchAddresses()
    }
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${backend_url}/allproducts`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCart = async () => {
    try {
      const response = await fetch(`${backend_url}/getcart`, {
        method: "POST",
        headers: {
          Accept: "application/form-data",
          "auth-token": `${localStorage.getItem("auth-token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(),
      })

      const data = await response.json()

      // Convertir el formato del carrito del backend al formato local
      const newCart = getDefaultCart()
      const newSizes = {}

      for (const key in data) {
        const [productId, size] = key.split("-")
        newCart[productId] = data[key].quantity
        newSizes[productId] = size
      }

      setCartItems(newCart)
      setSelectedSizes(newSizes)
    } catch (error) {
      console.error("Error fetching cart:", error)
    }
  }

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
        setUserAddresses(data.addresses)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  // Agregar nueva dirección
  const addAddress = async (addressData) => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("Usuario no autenticado")
      }

      const response = await fetch(`${backend_url}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify(addressData),
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar la lista de direcciones
        setUserAddresses([...userAddresses, data.address])
        return data.address
      } else {
        throw new Error(data.message || "Error al agregar dirección")
      }
    } catch (error) {
      console.error("Error adding address:", error)
      throw error
    }
  }

  // Actualizar dirección existente
  const updateAddress = async (addressId, addressData) => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("Usuario no autenticado")
      }

      const response = await fetch(`${backend_url}/addresses/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify(addressData),
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar la lista de direcciones
        setUserAddresses(userAddresses.map((addr) => (addr.id === addressId ? { ...addr, ...addressData } : addr)))
        return data.address
      } else {
        throw new Error(data.message || "Error al actualizar dirección")
      }
    } catch (error) {
      console.error("Error updating address:", error)
      throw error
    }
  }

  // Eliminar dirección
  const deleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("Usuario no autenticado")
      }

      const response = await fetch(`${backend_url}/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar la lista de direcciones
        setUserAddresses(userAddresses.filter((addr) => addr.id !== addressId))
        return true
      } else {
        throw new Error(data.message || "Error al eliminar dirección")
      }
    } catch (error) {
      console.error("Error deleting address:", error)
      throw error
    }
  }

  const getTotalCartAmount = () => {
    let totalAmount = 0
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = products.find((product) => product.id === Number(item))
        if (itemInfo) {
          totalAmount += cartItems[item] * itemInfo.new_price
        }
      }
    }
    return totalAmount
  }

  const getTotalCartItems = () => {
    let totalItem = 0
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        totalItem += cartItems[item]
      }
    }
    return totalItem
  }

  const addToCart = async (itemId, size) => {
    try {
      if (!localStorage.getItem("auth-token")) {
        alert("Por favor inicia sesión para agregar productos al carrito")
        return
      }

      const response = await fetch(`${backend_url}/addtocart`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": `${localStorage.getItem("auth-token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, size }),
      })

      if (response.ok) {
        setCartItems((prev) => {
          const newCart = { ...prev }
          newCart[itemId] = (newCart[itemId] || 0) + 1
          return newCart
        })
        setSelectedSizes((prev) => ({
          ...prev,
          [itemId]: size,
        }))
        alert("Producto agregado al carrito")
      } else {
        const data = await response.json()
        throw new Error(data.message || "Error al agregar al carrito")
      }
    } catch (error) {
      console.error("Error al agregar al carrito:", error)
      alert("Error al agregar el producto al carrito: " + error.message)
    }
  }

  const removeFromCart = async (itemId, isAfterPurchase = false) => {
    if (isAfterPurchase || window.confirm("¿Estás seguro que deseas eliminar este producto del carrito?")) {
      try {
        const size = selectedSizes[itemId]
        const response = await fetch(`${backend_url}/removefromcart`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "auth-token": `${localStorage.getItem("auth-token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId, size }),
        })

        if (response.ok) {
          setCartItems((prev) => {
            const newCart = { ...prev }
            if (newCart[itemId] > 0) {
              newCart[itemId] -= 1
            }
            return newCart
          })
          if (!isAfterPurchase) {
            alert("Producto eliminado del carrito")
          }
        } else {
          const data = await response.json()
          throw new Error(data.message || "Error al eliminar del carrito")
        }
      } catch (error) {
        console.error("Error al eliminar del carrito:", error)
        alert("Error al eliminar el producto del carrito: " + error.message)
      }
    }
  }

  const clearCart = () => {
    setCartItems(getDefaultCart())
    setSelectedSizes({})
  }

  const refreshAddresses = async () => {
    await fetchAddresses()
  }

  const contextValue = {
    products,
    loading,
    getTotalCartItems,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    selectedSizes,
    userAddresses,
    refreshAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    clearCart,
  }

  return <ShopContext.Provider value={contextValue}>{props.children}</ShopContext.Provider>
}

export default ShopContextProvider