import React, { useContext, useRef, useState } from 'react'
import './Navbar.css'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../Assets/clarks_logo.png'
import cart_icon from '../Assets/cart_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import nav_dropdown from '../Assets/nav_dropdown.png'

const Navbar = () => {

  let [menu,setMenu] = useState("shop");
  const {getTotalCartItems} = useContext(ShopContext);
  const navigate = useNavigate();

  const menuRef = useRef();

  const dropdown_toggle = (e) => {
    menuRef.current.classList.toggle('nav-menu-visible');
    e.target.classList.toggle('open');
  }

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    navigate('/');
  }

  return (
    <div className='nav'>
      <Link to='/' onClick={()=>{setMenu("shop")}} style={{ textDecoration: 'none' }} className="nav-logo">
        <img src={logo} alt="logo" />
        <p>Ropa Deportiva</p>
      </Link>
      <img onClick={dropdown_toggle} className='nav-dropdown' src={nav_dropdown} alt="" />
      <ul ref={menuRef} className="nav-menu">
        <li onClick={()=>{setMenu("shop")}}><Link to='/' style={{ textDecoration: 'none' }}>Tienda</Link>{menu==="shop"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("mens")}}><Link to='/mens' style={{ textDecoration: 'none' }}>Hombre</Link>{menu==="mens"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("womens")}}><Link to='/womens' style={{ textDecoration: 'none' }}>Mujer</Link>{menu==="womens"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("kids")}}><Link to='/kids' style={{ textDecoration: 'none' }}>Niño/a</Link>{menu==="kids"?<hr/>:<></>}</li>
      </ul>
      <div className="nav-login-cart">
        {localStorage.getItem('auth-token') ? (
          <div className="nav-login-cart">
            <Link to='/profile'>
              <button>Mi Perfil</button>
            </Link>
            <button onClick={handleLogout}>Cerrar Sesión</button>
            <Link to='/cart'>
              <img src={cart_icon} alt="" />
            </Link>
            <div className="nav-cart-count">{getTotalCartItems()}</div>
          </div>
        ) : (
          <Link to='/login'>
            <button>Login</button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default Navbar
