import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import UserContext from '../context/UserContext';
import { logout, db } from '../firebaseConfig';
import Notifications from './Notifications';
import '../Styles/Header.css';
import notificationEmpty from '../assets/notificationEmpty.png';
import notificationAlert from '../assets/notificationAlert.png';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Header = () => {
  const { user } = useContext(UserContext); // Eliminado `setUser` porque no se está utilizando
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [balance, setBalance] = useState(0.00);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [profilePic, setProfilePic] = useState(defaultProfilePic);

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
    if (user) {
      const userRef = doc(db, 'users', user.uid);

      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setBalance(userData.balance || 0.00);
          setProfilePic(userData.photoURL || defaultProfilePic); // Actualizar la foto de perfil en tiempo real
        }
      });

      return () => unsubscribe();
    }
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

  const handleSearchChange = async (e) => {
    const queryText = e.target.value.trim();
    setSearchQuery(queryText);

    if (queryText) {
      try {
        const q = query(
          collection(db, 'users'),
          where('username_lower', '>=', queryText.toLowerCase()),
          where('username_lower', '<=', queryText.toLowerCase() + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users: ', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <header className="header">
      <h1 className="header-title" onClick={() => navigate('/')}>ILLUSTRA</h1>
      <div className="header-search-bar">
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchResults.length > 0 && (
          <div className="header-search-dropdown">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="header-search-result-item"
                onClick={() => navigate(`/profile/${result.id}`)}
              >
                <img src={result.photoURL || defaultProfilePic} alt={result.username} />
                <div className="header-search-result-info">
                  <h3>{result.username}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
              <img src={profilePic} alt="Profile" className="header-profile-pic" />
              <span className="header-username">{user.username}</span>
              {dropdownVisible && (
                <div className="header-dropdown">
                  <div className="header-dropdown-item">Saldo: {balance.toFixed(2)}$</div>
                  <Link to={`/profile/${user.uid}`} className="header-dropdown-item">Perfil</Link>
                  <Link to="/workbench" className="header-dropdown-item">Mesa de trabajo</Link>
                  {user.role === 'admin' ? (
                    <Link to="/admin-dashboard" className="header-dropdown-item">Admin Dashboard</Link>
                  ) : (
                    <Link to="/dashboard" className="header-dropdown-item">Dashboard</Link>
                  )}
                  <Link to="/configuration" className="header-dropdown-item">Configuración</Link>
                  <Link to="/donations" className="header-dropdown-item">Donaciones</Link>
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
