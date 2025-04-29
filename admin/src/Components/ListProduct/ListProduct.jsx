import React, { useEffect, useState } from "react";
import "./ListProduct.css";
import cross_icon from '../Assets/cross_icon.png'
import { backend_url, currency } from "../../App";

const ListProduct = () => {
  const [allproducts, setAllProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    new_price: '',
    old_price: '',
    sizes: []
  });

  const fetchInfo = () => {
    fetch(`${backend_url}/allproducts`)
      .then((res) => res.json())
      .then((data) => setAllProducts(data))
  }

  useEffect(() => {
    fetchInfo();
  }, [])

  const removeProduct = async (id) => {
    await fetch(`${backend_url}/removeproduct`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    })
    fetchInfo();
  }

  const handleEditClick = (product) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      new_price: product.new_price,
      old_price: product.old_price,
      sizes: product.sizes || []
    });
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...editForm.sizes];
    newSizes[index] = {
      ...newSizes[index],
      [field]: value
    };
    setEditForm(prev => ({
      ...prev,
      sizes: newSizes
    }));
  }

  const addSize = () => {
    setEditForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', stock: 0 }]
    }));
  }

  const removeSize = (index) => {
    const newSizes = editForm.sizes.filter((_, i) => i !== index);
    setEditForm(prev => ({
      ...prev,
      sizes: newSizes
    }));
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editForm.name || !editForm.new_price || !editForm.old_price) {
        alert("Por favor, complete todos los campos");
        return;
      }

      const updateData = {
        id: editingProduct,
        name: editForm.name,
        new_price: Number(editForm.new_price),
        old_price: Number(editForm.old_price),
        sizes: editForm.sizes
      };

      console.log("Enviando datos de actualización:", updateData);

      const response = await fetch(`${backend_url}/updateproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (data.success) {
        setAllProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === editingProduct 
              ? { 
                  ...product, 
                  name: updateData.name,
                  new_price: updateData.new_price,
                  old_price: updateData.old_price,
                  sizes: updateData.sizes
                }
              : product
          )
        );
        setEditingProduct(null);
        alert("Producto actualizado correctamente");
      } else {
        alert(data.message || "Error al actualizar el producto");
      }
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      alert(`Error al actualizar el producto: ${error.message}`);
    }
  }

  return (
    <div className="listproduct">
      <h1>Productos registrados</h1>
      <div className="listproduct-format-main">
        <p>Imagen</p> <p>Nombre</p> <p>Precio anterior</p> <p>Precio nuevo</p> <p>Categoria</p> <p>Acciones</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {allproducts.map((e, index) => (
          <div key={index}>
            <div className="listproduct-format-main listproduct-format">
              <img className="listproduct-product-icon" src={backend_url + e.image} alt="" />
              {editingProduct === e.id ? (
                <form onSubmit={handleEditSubmit} className="edit-form">
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="edit-input"
                  />
                  <input
                    type="number"
                    name="old_price"
                    value={editForm.old_price}
                    onChange={handleEditChange}
                    className="edit-input"
                  />
                  <input
                    type="number"
                    name="new_price"
                    value={editForm.new_price}
                    onChange={handleEditChange}
                    className="edit-input"
                  />
                  <div className="sizes-section">
                    <h4>Tallas y Stock</h4>
                    {editForm.sizes.map((size, index) => (
                      <div key={index} className="size-input-group">
                        <input
                          type="text"
                          placeholder="Talla"
                          value={size.size}
                          onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                          className="edit-input"
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={size.stock}
                          onChange={(e) => handleSizeChange(index, 'stock', parseInt(e.target.value))}
                          className="edit-input"
                        />
                        <button type="button" onClick={() => removeSize(index)} className="remove-size-button">X</button>
                      </div>
                    ))}
                    <button type="button" onClick={addSize} className="add-size-button">+ Agregar Talla</button>
                  </div>
                  <div className="edit-actions">
                    <button type="submit" className="save-button">Guardar</button>
                    <button type="button" onClick={() => setEditingProduct(null)} className="cancel-button">Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="cartitems-product-title">{e.name}</p>
                  <p>{currency}{e.old_price}</p>
                  <p>{currency}{e.new_price}</p>
                  <p>{e.category}</p>
                  <div className="action-buttons">
                    <button onClick={() => handleEditClick(e)} className="edit-button">Editar</button>
                    <img className="listproduct-remove-icon" onClick={() => { removeProduct(e.id) }} src={cross_icon} alt="" />
                  </div>
                </>
              )}
            </div>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListProduct;
