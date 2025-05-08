import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    category: '',
    new_price: '',
    old_price: '',
    sizes: [
      { size: 'S', stock: 0 },
      { size: 'M', stock: 0 },
      { size: 'L', stock: 0 },
      { size: 'XL', stock: 0 },
      { size: 'XXL', stock: 0 }
    ]
  });

  const handleSizeChange = (index, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index].stock = parseInt(value) || 0;
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/addproduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('Producto agregado exitosamente');
        navigate('/admin/products');
      } else {
        alert('Error al agregar el producto');
      }
    } catch (error) {
      console.error('Error al agregar producto:', error);
      alert('Error al agregar el producto');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('product', file);

      try {
        const response = await fetch('http://localhost:4000/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            image: data.image_url
          }));
        } else {
          alert('Error al subir la imagen');
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        alert('Error al subir la imagen');
      }
    }
  };

  return (
    <div className="add-product-container">
      <h2>Agregar Nuevo Producto</h2>
      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group">
          <label>Nombre:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Descripción:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Categoría:</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Seleccionar categoría</option>
            <option value="men">Hombres</option>
            <option value="women">Mujeres</option>
            <option value="kid">Niños</option>
          </select>
        </div>
        <div className="form-group">
          <label>Precio Nuevo:</label>
          <input
            type="number"
            value={formData.new_price}
            onChange={(e) => setFormData({ ...formData, new_price: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Precio Antiguo:</label>
          <input
            type="number"
            value={formData.old_price}
            onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Imagen:</label>
          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            required
          />
          {formData.image && (
            <img src={formData.image} alt="Preview" className="image-preview" />
          )}
        </div>
        <div className="form-group">
          <label>Tallas y Stock:</label>
          <div className="sizes-grid">
            {formData.sizes.map((size, index) => (
              <div key={size.size} className="size-input">
                <label>{size.size}:</label>
                <input
                  type="number"
                  value={size.stock}
                  onChange={(e) => handleSizeChange(index, e.target.value)}
                  min="0"
                  required
                />
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn">Agregar Producto</button>
          <button type="button" onClick={() => navigate('/admin/products')} className="cancel-btn">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct; 