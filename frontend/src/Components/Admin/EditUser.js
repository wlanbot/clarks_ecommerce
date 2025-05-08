import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './EditUser.css';

const EditUser = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:4000/allusers');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/updateuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: editingUser._id,
          name: formData.name,
          email: formData.email
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Usuario actualizado exitosamente');
        setEditingUser(null);
        fetchUsers();
      } else {
        alert('Error al actualizar el usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar el usuario');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const response = await fetch('http://localhost:4000/removeuser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ _id: userId }),
        });

        const data = await response.json();
        if (data.success) {
          alert('Usuario eliminado exitosamente');
          fetchUsers();
        } else {
          alert('Error al eliminar el usuario');
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
      }
    }
  };

  return (
    <div className="edit-user-container">
      <h2>Editar Usuarios</h2>
      <div className="users-list">
        {users.map((user) => (
          <div key={user._id} className="user-item">
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <p>Fecha de registro: {new Date(user.date).toLocaleDateString()}</p>
            </div>
            <div className="user-actions">
              <button onClick={() => handleEdit(user)} className="edit-btn">
                <FaEdit /> Editar
              </button>
              <button onClick={() => handleDelete(user._id)} className="delete-btn">
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <div className="edit-form-overlay">
          <div className="edit-form">
            <h3>Editar Usuario</h3>
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
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Guardar Cambios</button>
                <button type="button" onClick={() => setEditingUser(null)} className="cancel-btn">
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

export default EditUser; 