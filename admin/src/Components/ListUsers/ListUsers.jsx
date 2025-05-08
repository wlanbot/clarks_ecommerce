import React, { useEffect, useState } from "react";
import "./ListUsers.css";
import cross_icon from '../Assets/cross_icon.png'
import clarks_logo from '../Assets/clarks_logo.png'
import { backend_url } from "../../App";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const generateReport = () => {
    const doc = new jsPDF();
    
    // Agregar el logo con transparencia
    doc.addImage(clarks_logo, 'PNG', 14, 10, 45, 35, undefined, 'FAST', 0.4);
    
    // Título del reporte
    doc.setFontSize(16);
    doc.text('Reporte de Usuarios', 65, 25);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 65, 35);
    
    // Tabla de usuarios
    const tableColumn = ["Nombre", "Email", "Fecha de Registro"];
    const tableRows = allusers.map(user => [
      user.name,
      user.email,
      new Date(user.date).toLocaleDateString()
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [65, 116, 255] }
    });
    
    // Guardar el PDF
    doc.save('reporte_usuarios.pdf');
  };

  return (
    <div className="listusers">
      <div className="listusers-header">
        <h1>Usuarios registrados</h1>
        <button onClick={generateReport} className="report-button">
          Generar Reporte
        </button>
      </div>
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