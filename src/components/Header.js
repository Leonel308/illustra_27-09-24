import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import UserContext from '../context/UserContext';
import { logout, db } from '../firebaseConfig';
import Notifications from './Notifications';
import '../Styles/Header.css';
import notificationEmpty from '../assets/notificationEmpty.png';
import notificationAlert from '../assets/notificationAlert.png';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [balance, setBalance] = useState(0.00);
  const [isArtist, setIsArtist] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const toggleNotifications = () => {
    setNotificationsVisible(!notificationsVisible);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setBalance(userData.balance || 0.00);
            setIsArtist(userData.isArtist || false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user) {
      const notificationsRef = collection(db, 'users', user.uid, 'Notifications');
      const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
        setHasNotifications(!snapshot.empty);
      });

      return () => unsubscribe();
    }
  }, [user]);

  return (
    <header className="header">
      <h1 className="header-title" onClick={() => navigate('/')}>ILLUSTRA</h1>
      <div className="header-nav">
        <Link className="header-button" to="/explore-posts">Explorar</Link>
        {user ? (
          <>
            <button className="header-button create-post-button" onClick={() => navigate('/create-post')}>Crear Publicación</button>
            
            <div className="header-notifications" onClick={toggleNotifications}>
              <img 
                src={hasNotifications ? notificationAlert : notificationEmpty} 
                alt="Notificaciones" 
                className="header-notifications-icon" 
              />
              {notificationsVisible && (
                <div className="header-notifications-dropdown">
                  <Notifications />
                </div>
              )}
            </div>

            <div className="header-user" onClick={toggleDropdown}>
              <img src={user.photoURL || defaultProfilePic} alt="Profile" className="header-profile-pic" />
              <span className="header-username">{user.username}</span>
              {dropdownVisible && (
                <div className="header-dropdown">
                  <div className="header-dropdown-item">Saldo: {balance.toFixed(2)}$</div>
                  <Link to={`/profile/${user.uid}`} className="header-dropdown-item">Perfil</Link>
                  {isArtist && (
                    <Link to="/workbench" className="header-dropdown-item">Mesa de Trabajo</Link>
                  )}
                  {user.role === 'admin' ? (
                    <Link to="/admin-dashboard" className="header-dropdown-item">Admin Dashboard</Link>
                  ) : (
                    <Link to="/dashboard" className="header-dropdown-item">Dashboard</Link>
                  )}
                  <Link to="/configuration" className="header-dropdown-item">Configuración</Link>
                  <Link to="/donations" className="header-dropdown-item">Donaciones</Link>
                  <Link to="/explore-posts" className="header-dropdown-item">Explorar</Link>
                  <button onClick={handleLogout} className="header-dropdown-item logout-button">Log out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="header-buttons">
            <Link to="/login" className="header-button">Log In</Link>
            <Link to="/register" className="header-button">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
