import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { backend_url } from '../../App';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UserProfile component mounted');
    const token = localStorage.getItem('auth-token');
    console.log('Token:', token ? 'Present' : 'Not present');

    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        console.log('Fetching user data...');
        const response = await fetch(`${backend_url}/userdata`, {
          headers: {
            'auth-token': token
          }
        });

        console.log('User data response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('User data received:', data);
          setUserData(data);
        } else {
          console.log('Error fetching user data, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        setError('Error al cargar los datos del usuario');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchPurchaseHistory = async () => {
      try {
        console.log('Fetching purchase history...');
        const response = await fetch(`${backend_url}/purchasehistory`, {
          method: 'POST',
          headers: {
            'auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        console.log('Purchase history response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Purchase history received:', data);
          setPurchaseHistory(data.purchaseHistory || []);
        } else {
          console.log('Error fetching purchase history');
          setError('Error al cargar el historial de compras');
        }
      } catch (error) {
        console.error('Error al obtener historial de compras:', error);
        setError('Error al cargar el historial de compras');
      }
    };

    fetchUserData();
    fetchPurchaseHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    navigate('/');
  };

  if (loading) {
    return <div className="user-profile">Cargando...</div>;
  }

  if (error) {
    return <div className="user-profile">{error}</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-content">
        <div className="profile-section">
          <h2>Mi Perfil</h2>
          {userData && (
            <div className="profile-info">
              <p><strong>Nombre:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Miembro desde:</strong> {new Date(userData.date).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="purchases-section">
          <h2>Mis Compras</h2>
          {purchaseHistory.length > 0 ? (
            <div className="purchase-list">
              {purchaseHistory.map((purchase, index) => (
                <div key={index} className="purchase-item">
                  <div className="purchase-header">
                    <span>Compra #{index + 1}</span>
                    <span>{new Date(purchase.date).toLocaleDateString()}</span>
                  </div>
                  <div className="purchase-products">
                    {purchase.products.map((item, itemIndex) => (
                      <div key={itemIndex} className="purchase-product">
                        <img src={backend_url + item.productDetails.image} alt={item.productDetails.name} />
                        <div className="purchase-product-info">
                          <h4>{item.productDetails.name}</h4>
                          <p>Talla: {item.size}</p>
                          <p>Cantidad: {item.quantity}</p>
                          <p>Precio: ${item.productDetails.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="purchase-total">
                    <strong>Total: ${purchase.total}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay compras registradas</p>
          )}
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 