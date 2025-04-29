import React, { createContext, useEffect, useState } from "react";
import { backend_url } from "../App";

export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());

  useEffect(() => {
    fetch(`${backend_url}/allproducts`)
      .then((res) => res.json())
      .then((data) => setProducts(data));

    if (localStorage.getItem("auth-token")) {
      fetch(`${backend_url}/getcart`, {
        method: 'POST',
        headers: {
          Accept: 'application/form-data',
          'auth-token': `${localStorage.getItem("auth-token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(),
      })
        .then((resp) => resp.json())
        .then((data) => { 
          // Convertir los datos del carrito al formato original
          const formattedCart = getDefaultCart();
          Object.entries(data).forEach(([key, value]) => {
            const [itemId] = key.split('-');
            formattedCart[itemId] = value.quantity || 0;
          });
          setCartItems(formattedCart);
        });
    }
  }, []);

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = products.find((product) => product.id === Number(item));
        if (itemInfo) {
          totalAmount += cartItems[item] * itemInfo.new_price;
        }
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        totalItem += cartItems[item];
      }
    }
    return totalItem;
  };

  const addToCart = async (itemId, size) => {
    try {
      const response = await fetch(`${backend_url}/addtocart`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'auth-token': `${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, size }),
      });

      if (response.ok) {
        setCartItems((prev) => {
          const newCart = { ...prev };
          newCart[itemId] = (newCart[itemId] || 0) + 1;
          return newCart;
        });
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`${backend_url}/removefromcart`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'auth-token': `${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        setCartItems((prev) => {
          const newCart = { ...prev };
          if (newCart[itemId] > 0) {
            newCart[itemId] -= 1;
          }
          return newCart;
        });
      }
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
    }
  };

  const contextValue = { products, getTotalCartItems, cartItems, addToCart, removeFromCart, getTotalCartAmount };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
