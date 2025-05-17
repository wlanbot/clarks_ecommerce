import React, { useState } from "react";
import "./CSS/LoginSignup.css";

const LoginSignup = () => {
  const [state, setState] = useState("Iniciar sesión");
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  const validateForm = () => {
    // Validación para el nombre (solo verificar que no esté vacío)
    if (state === "Crear una cuenta") {
      if (!formData.username.trim()) {
        alert("Por favor ingresa tu nombre");
        return false;
      }
    }
    
    // Validación para el email
    if (!formData.email.trim()) {
      alert("Por favor ingresa tu correo electrónico");
      return false;
    }
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)) {
      alert("Por favor ingresa un correo electrónico válido");
      return false;
    }
    
    // Validación para la contraseña (solo verificar que no esté vacía)
    if (!formData.password) {
      alert("Por favor ingresa tu contraseña");
      return false;
    }

    return true;
  };

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleError = (error) => {
    if (error.includes("email already exists")) {
      alert("Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.");
    } else if (error.includes("Invalid credentials")) {
      alert("Correo electrónico o contraseña incorrectos");
    } else if (error.includes("User not found")) {
      alert("No existe una cuenta con este correo electrónico");
    } else {
      alert(error);
    }
  };

  const login = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          Accept: 'application/form-data',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        // Obtener headers personalizados
        const customerId = response.headers.get('x-customer-id');
        const customerEmail = response.headers.get('x-customer-email');

        // Guardarlos en localStorage
        localStorage.setItem('auth-token', data.token);
        if (customerId) localStorage.setItem('customer-id', customerId);
        if (customerEmail) localStorage.setItem('customer-email', customerEmail);

        window.location.replace("/");
      } else {
        handleError(data.errors);
      }
    } catch (error) {
      alert("Error de conexión. Por favor, intente nuevamente.");
    }
  };

  const signup = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers: {
          Accept: 'application/form-data',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        // Obtener headers personalizados
        const customerId = response.headers.get('x-customer-id');
        const customerEmail = response.headers.get('x-customer-email');

        // Guardarlos en localStorage
        localStorage.setItem('auth-token', data.token);
        if (customerId) localStorage.setItem('customer-id', customerId);
        if (customerEmail) localStorage.setItem('customer-email', customerEmail);

        window.location.replace("/");
      } else {
        handleError(data.errors);
      }
    } catch (error) {
      alert("Error de conexión. Por favor, intente nuevamente.");
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className="loginsignup-fields">
          {state === "Crear una cuenta" ? (
            <input 
              type="text" 
              placeholder="Nombre" 
              name="username" 
              value={formData.username} 
              onChange={changeHandler} 
            />
          ) : (
            <></>
          )}
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            name="email" 
            value={formData.email} 
            onChange={changeHandler} 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            name="password" 
            value={formData.password} 
            onChange={changeHandler} 
          />
        </div>

        <button onClick={() => { state === "Iniciar sesión" ? login() : signup() }}>Aceptar</button>

        {state === "Iniciar sesión" ? (
          <p className="loginsignup-login">
            ¿Aún no tienes una cuenta?
            <span onClick={() => { setState("Crear una cuenta"); setFormData({ username: "", email: "", password: "" }); }}> Regístrate</span>
          </p>
        ) : (
          <p className="loginsignup-login">
            ¿Ya tienes una cuenta?
            <span onClick={() => { setState("Iniciar sesión"); setFormData({ username: "", email: "", password: "" }); }}> Inicia sesión aquí</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
