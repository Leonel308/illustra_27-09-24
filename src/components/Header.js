import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserContext from '../context/UserContext';
import { logout } from '../firebaseConfig';
import '../Styles/Header.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Header = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="header">
      <h1 className="header-title" onClick={() => navigate('/')}>ILLUSTRA</h1>
      <div className="header-nav">
        <Link className="header-button" to="/explore-posts">Explorar</Link>
        {user ? (
          <>
            <button className="header-button create-post-button" onClick={() => navigate('/create-post')}>Crear Publicación</button>
            <div className="header-user" onClick={toggleDropdown}>
              <img src={user.photoURL || defaultProfilePic} alt="Profile" className="header-profile-pic" />
              <span className="header-username">{user.username}</span>
              {dropdownVisible && (
                <div className="header-dropdown">
                  <div className="header-dropdown-item">Saldo: 0.00$</div>
                  <Link to={`/profile/${user.uid}`} className="header-dropdown-item">Perfil</Link>
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
