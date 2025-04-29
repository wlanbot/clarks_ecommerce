import React from 'react'
import './Sidebar.css'
import { Link } from 'react-router-dom'
import add_product_icon from '../Assets/add_product_icon.png'
import list_product_icon from '../Assets/list_product_icon.png'
import user_icon from '../Assets/user_icon.png'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <Link to='/addproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={add_product_icon} alt="" />
          <p>Añadir Producto</p>
        </div>
      </Link>
      <Link to='/listproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={list_product_icon} alt="" />
          <p>Lista de Productos</p>
        </div>
      </Link>
      <Link to='/listusers' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={user_icon} alt="" />
          <p>Gestionar Usuarios</p>
        </div>
      </Link>
    </div>
  )
}

export default Sidebar
