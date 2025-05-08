import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './EditProduct.css';

const EditProduct = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/allproducts');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      new_price: product.new_price,
      old_price: product.old_price,
      sizes: product.sizes || [
        { size: 'S', stock: 0 },
        { size: 'M', stock: 0 },
        { size: 'L', stock: 0 },
        { size: 'XL', stock: 0 },
        { size: 'XXL', stock: 0 }
      ]
    });
  };

  const handleSizeChange = (index, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index].stock = parseInt(value) || 0;
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/updateproduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProduct.id,
          name: formData.name,
          new_price: formData.new_price,
          old_price: formData.old_price,
          sizes: formData.sizes
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Producto actualizado exitosamente');
        setEditingProduct(null);
        fetchProducts();
      } else {
        alert('Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al actualizar el producto');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const response = await fetch('http://localhost:4000/removeproduct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: productId }),
        });

        const data = await response.json();
        if (data.success) {
          alert('Producto eliminado exitosamente');
          fetchProducts();
        } else {
          alert('Error al eliminar el producto');
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  return (
    <div className="edit-product-container">
      <h2>Editar Productos</h2>
      <div className="products-list">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <img src={product.image} alt={product.name} />
            <div className="product-info">
              <h3>{product.name}</h3>
              <p>Precio: ${product.new_price}</p>
              <div className="product-actions">
                <button onClick={() => handleEdit(product)} className="edit-btn">
                  <FaEdit /> Editar
                </button>
                <button onClick={() => handleDelete(product.id)} className="delete-btn">
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="edit-form-overlay">
          <div className="edit-form">
            <h3>Editar Producto</h3>
            <form onSubmit={handleSubmit}>
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
                <button type="submit" className="save-btn">Guardar Cambios</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="cancel-btn">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProduct; 