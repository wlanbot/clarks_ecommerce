import React from 'react'
import './Sidebar.css'
import add_product_icon from '../Assets/article_add.svg'
import list_product_icon from '../Assets/article_list.svg'
import { Link } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <Link to='/addproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={add_product_icon} alt="" />
          <p>Añadir producto</p>
        </div>
      </Link>
      <Link to='/listproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={list_product_icon} alt="" />
          <p>Gestión de productos</p>
        </div>
      </Link>
      
    </div>
  )
}

export default Sidebar
