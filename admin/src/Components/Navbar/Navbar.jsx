import React from 'react'
import './Navbar.css'
import navlogo from '../Assets/clarks_logo.png'


const Navbar = () => {
  return (
    <div className='navbar'>
      <img src={navlogo} className='nav-logo' alt="" />
      <p>Panel de administrador</p>
      
    </div>
  )
}

export default Navbar
