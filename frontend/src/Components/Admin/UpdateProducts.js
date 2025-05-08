import React, { useState } from 'react';
import './UpdateProducts.css';

const UpdateProducts = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    if (window.confirm('¿Estás seguro de que deseas actualizar todos los productos con las tallas predefinidas?')) {
      setIsUpdating(true);
      setMessage('Actualizando productos...');
      
      try {
        const response = await fetch('http://localhost:4000/updateallproducts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        if (data.success) {
          setMessage(data.message);
        } else {
          setMessage('Error: ' + data.message);
        }
      } catch (error) {
        setMessage('Error al actualizar los productos: ' + error.message);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="update-products-container">
      <h2>Actualizar Productos</h2>
      <p>Este proceso actualizará todos los productos existentes para que tengan las tallas predefinidas (S, M, L, XL, XXL).</p>
      <p>El stock existente se mantendrá para las tallas que ya existan.</p>
      
      <button 
        onClick={handleUpdate} 
        disabled={isUpdating}
        className="update-btn"
      >
        {isUpdating ? 'Actualizando...' : 'Actualizar Todos los Productos'}
      </button>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UpdateProducts; 