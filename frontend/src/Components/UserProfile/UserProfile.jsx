import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { backend_url, currency } from "../../App";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        console.log('Token encontrado:', token);

        if (!token) {
          console.log('No hay token, redirigiendo a login');
          navigate('/login');
          return;
        }

        // Fetch user data
        console.log('Intentando obtener datos del usuario...');
        const userResponse = await fetch(`${backend_url}/userdata`, {
          method: 'POST',
          headers: {
            'auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        console.log('Respuesta de userdata:', userResponse.status);
        const userData = await userResponse.json();
        console.log('Datos del usuario recibidos:', userData);

        if (!userResponse.ok) {
          throw new Error(userData.message || 'Error al obtener datos del usuario');
        }

        if (!userData.success) {
          throw new Error(userData.message || 'Error en la respuesta del servidor');
        }

        setUserData(userData);

        // Fetch purchase history
        console.log('Intentando obtener historial de compras...');
        const purchaseResponse = await fetch(`${backend_url}/purchasehistory`, {
          method: 'POST',
          headers: {
            'auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        console.log('Respuesta de purchasehistory:', purchaseResponse.status);
        const purchaseData = await purchaseResponse.json();
        console.log('Historial de compras recibido:', purchaseData);

        if (!purchaseResponse.ok) {
          throw new Error(purchaseData.message || 'Error al obtener historial de compras');
        }

        if (!purchaseData.success) {
          throw new Error(purchaseData.message || 'Error en la respuesta del servidor');
        }

        console.log('Datos de compra procesados:', purchaseData.purchaseHistory);
        const processedHistory = purchaseData.purchaseHistory.map(purchase => ({
          date: purchase.date,
          total: purchase.total,
          products: purchase.products
        }));
        console.log('Historial procesado:', processedHistory);
        setPurchaseHistory(processedHistory);

      } catch (error) {
        console.error('Error en fetchData:', error);
        setError(error.message);
        if (error.message.includes('token') || error.message.includes('no autorizado')) {
          localStorage.removeItem('auth-token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      localStorage.removeItem('auth-token');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile">
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => navigate('/login')}>Ir a iniciar sesión</button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile">
        <div className="error-message">
          <p>No se pudieron cargar los datos del usuario</p>
          <button onClick={() => navigate('/login')}>Ir a iniciar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-sidebar">
        <div className="sidebar-header">
          <h3>Mi Cuenta</h3>
        </div>
        <div className="sidebar-menu">
          <button 
            className={activeTab === 'profile' ? 'active' : ''} 
            onClick={() => setActiveTab('profile')}
          >
            Información Personal
          </button>
          <button 
            className={activeTab === 'purchases' ? 'active' : ''} 
            onClick={() => setActiveTab('purchases')}
          >
            Mis Compras
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Información Personal</h2>
            <div className="profile-info">
              <div className="profile-info-item">
                <label>Nombre:</label>
                <p>{userData.name}</p>
              </div>
              <div className="profile-info-item">
                <label>Email:</label>
                <p>{userData.email}</p>
              </div>
              <div className="profile-info-item">
                <label>Miembro desde:</label>
                <p>{new Date(userData.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="purchases-section">
            <h2>Mis Compras</h2>
            {purchaseHistory.length > 0 ? (
              <div className="purchase-list">
                {purchaseHistory.map((purchase, index) => {
                  console.log(`Renderizando compra #${index + 1}:`, purchase);
                  return (
                    <div key={index} className="purchase-item">
                      <div className="purchase-header">
                        <span>Compra #{index + 1}</span>
                        <span>
                          {purchase.date ? new Date(purchase.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Fecha no disponible'}
                        </span>
                      </div>
                      <div className="purchase-products">
                        {purchase.products && purchase.products.map((item, itemIndex) => (
                          <div key={itemIndex} className="purchase-product">
                            <img 
                              src={backend_url + (item.productDetails?.image || '')} 
                              alt={item.productDetails?.name || 'Producto'} 
                            />
                            <div className="purchase-product-info">
                              <h4>{item.productDetails?.name || 'Producto no disponible'}</h4>
                              <div className="purchase-product-details">
                                <p><strong>Talla:</strong> {item.size || 'No especificada'}</p>
                                <p><strong>Cantidad:</strong> {item.quantity || 0}</p>
                                <p><strong>Precio:</strong> ${(item.productDetails?.price || 0).toFixed(2)}</p>
                                <p><strong>Subtotal:</strong> ${((item.productDetails?.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="purchase-total">
                        <strong>Total de la compra: ${(purchase.total || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-purchases">
                <p>No hay compras registradas</p>
                <button onClick={() => navigate('/')}>Ir a la tienda</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 