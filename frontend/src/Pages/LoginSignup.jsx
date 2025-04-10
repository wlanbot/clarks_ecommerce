import React, { useState } from "react";
import "./CSS/LoginSignup.css";

const LoginSignup = () => {

  const [state,setState] = useState("Iniciar sesión");
  const [formData,setFormData] = useState({username:"",email:"",password:""});

  const changeHandler = (e) => {
    setFormData({...formData,[e.target.name]:e.target.value});
    }

  const login = async () => {
    let dataObj;
    await fetch('http://localhost:4000/login', {
      method: 'POST',
      headers: {
        Accept:'application/form-data',
        'Content-Type':'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((resp) => resp.json())
      .then((data) => {dataObj=data});
      console.log(dataObj);
      if (dataObj.success) {
        localStorage.setItem('auth-token',dataObj.token);
        window.location.replace("/");
      }
      else
      {
        alert(dataObj.errors)
      }
  }

  const signup = async () => {
    let dataObj;
    await fetch('http://localhost:4000/signup', {
      method: 'POST',
      headers: {
        Accept:'application/form-data',
        'Content-Type':'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((resp) => resp.json())
      .then((data) => {dataObj=data});

      if (dataObj.success) {
        localStorage.setItem('auth-token',dataObj.token);
        window.location.replace("/");
      }
      else
      {
        alert(dataObj.errors)
      }
  }

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className="loginsignup-fields">
          {state==="Crear una cuenta"?<input type="text" placeholder="Nombre" name="username" value={formData.username} onChange={changeHandler}/>:<></>}
          <input type="email" placeholder="Correo electrónico" name="email" value={formData.email} onChange={changeHandler}/>
          <input type="password" placeholder="Contraseña" name="password" value={formData.password} onChange={changeHandler}/>
        </div>

        <button onClick={()=>{state==="Iniciar sesión"?login():signup()}}>Aceptar</button>

        {state==="Iniciar sesión"?
        <p className="loginsignup-login">¿Aún no tienes una cuenta?<span onClick={()=>{setState("Crear una cuenta")}}> Regístrate</span></p>
        :<p className="loginsignup-login">¿Ya tienes una cuenta? <span onClick={()=>{setState("Iniciar sesión")}}> Inicia sesión aquí</span></p>}

      </div>
    </div>
  );
};

export default LoginSignup;
