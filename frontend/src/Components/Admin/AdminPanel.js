import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <h2>Panel de Administración</h2>
        <nav>
          <ul>
            <li>
              <Link to="/admin/products">Productos</Link>
            </li>
            <li>
              <Link to="/admin/addproduct">Agregar Producto</Link>
            </li>
            <li>
              <Link to="/admin/users">Usuarios</Link>
            </li>
            <li>
              <Link to="/admin/updateproducts">Actualizar Productos</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminPanel; 