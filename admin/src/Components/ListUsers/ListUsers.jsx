import React, { useEffect, useState } from "react";
import "./ListUsers.css";
import cross_icon from '../Assets/cross_icon.png'
import { backend_url } from "../../App";

const ListUsers = () => {
  const [allusers, setAllUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });

  const fetchUsers = async () => {
    try {
      console.log("Intentando obtener usuarios desde:", `${backend_url}/allusers`);
      const response = await fetch(`${backend_url}/allusers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos de usuarios:", data);
      
      if (Array.isArray(data)) {
        setAllUsers(data);
      } else {
        console.error("Los datos recibidos no son un array:", data);
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      alert("Error al cargar los usuarios. Por favor, intente nuevamente.");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const removeUser = async (_id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        const response = await fetch(`${backend_url}/removeuser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ _id }),
        });

        const data = await response.json();
        if (data.success) {
          fetchUsers();
          alert("Usuario eliminado correctamente");
        } else {
          alert(data.message || "Error al eliminar el usuario");
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert("Error al eliminar el usuario");
      }
    }
  }

  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name,
      email: user.email
    });
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar que los campos no estén vacíos
      if (!editForm.name || !editForm.email) {
        alert("Por favor, complete todos los campos");
        return;
      }

      const response = await fetch(`${backend_url}/updateuser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: editingUser,
          ...editForm
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAllUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === editingUser 
              ? { ...user, ...editForm }
              : user
          )
        );
        setEditingUser(null);
        alert("Usuario actualizado correctamente");
      } else {
        alert(data.message || "Error al actualizar el usuario");
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert("Error al actualizar el usuario");
    }
  }

  return (
    <div className="listusers">
      <h1>Usuarios registrados</h1>
      {allusers.length === 0 ? (
        <div className="no-users-message">
          <p>No hay usuarios registrados</p>
        </div>
      ) : (
        <>
          <div className="listusers-format-main">
            <p>Nombre</p>
            <p>Email</p>
            <p>Fecha de registro</p>
            <p>Acciones</p>
          </div>
          <div className="listusers-allusers">
            <hr />
            {allusers.map((user, index) => (
              <div key={index}>
                <div className="listusers-format-main listusers-format">
                  {editingUser === user._id ? (
                    <form onSubmit={handleEditSubmit} className="edit-form">
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="edit-input"
                        placeholder="Nombre"
                      />
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="edit-input"
                        placeholder="Email"
                      />
                      <p>{new Date(user.date).toLocaleDateString()}</p>
                      <div className="edit-actions">
                        <button type="submit" className="save-button">Guardar</button>
                        <button type="button" onClick={() => setEditingUser(null)} className="cancel-button">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                      <p>{new Date(user.date).toLocaleDateString()}</p>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(user)} className="edit-button">Editar</button>
                        <img className="listusers-remove-icon" onClick={() => removeUser(user._id)} src={cross_icon} alt="" />
                      </div>
                    </>
                  )}
                </div>
                <hr />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ListUsers; 