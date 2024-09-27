import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import {
  FaBell,
  FaSearch,
  FaBars,
  FaPlus,
  FaTimes,
} from 'react-icons/fa';
import UserContext from '../context/UserContext';
import { logout, db } from '../firebaseConfig';
import Notifications from './Notifications';
import AddBalanceModal from './addBalance'; // Asegúrate de que la ruta y el nombre del archivo son correctos
import Membership from './HomeComponents/Membership'; // Importa el componente de membresía
import '../Styles/Header.css';

const defaultProfilePic =
  'https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886';

export default function Header() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [profilePic, setProfilePic] = useState(defaultProfilePic);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false); // Estado para el modal de membresía
  const [animateBell, setAnimateBell] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
    setNotificationsVisible(false);
  };

  const toggleNotifications = () => {
    setNotificationsVisible((prev) => !prev);
    setDropdownVisible(false);
  };

  // Funciones para manejar el modal de Membresía
  const handleMembershipClick = () => {
    setShowMembershipModal(true);
    setDropdownVisible(false);
    setNotificationsVisible(false);
  };

  const handleMembershipClose = () => {
    setShowMembershipModal(false);
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
          setBalance(userData.balance || 0);
          setPendingBalance(userData.pendingBalance || 0);
          setProfilePic(userData.photoURL || defaultProfilePic);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const notificationsCollectionRef = collection(
        db,
        'users',
        user.uid,
        'Notifications'
      );
      const unsubscribe = onSnapshot(notificationsCollectionRef, (snapshot) => {
        setHasNotifications(!snapshot.empty);
        if (!snapshot.empty) {
          setAnimateBell(true);
          setTimeout(() => setAnimateBell(false), 1000);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsVisible(false);
      }
      // No es necesario manejar clics fuera para el modal de membresía si maneja su propio cierre
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = async (e) => {
    const queryText = e.target.value.trim();
    setSearchQuery(queryText);

    if (queryText.length >= 2) {
      try {
        const q = query(
          collection(db, 'users'),
          where('username_lower', '>=', queryText.toLowerCase()),
          where('username_lower', '<=', queryText.toLowerCase() + '\uf8ff'),
          limit(5)
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

  const handleAddBalance = async (amount) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const newBalance = Number(userData.balance || 0) + amount;
      await updateDoc(userRef, { balance: newBalance });
      setBalance(newBalance);
      setShowAddBalanceModal(false); // Cerrar modal después de agregar balance
    }
  };

  const handleAddBalanceClick = (e) => {
    e.stopPropagation();
    setShowAddBalanceModal(true);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title" onClick={() => navigate('/')}>
          ILLUSTRA
        </h1>
        <div className="header-search-bar">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <FaSearch className="search-icon" />
          {searchResults.length > 0 && (
            <div className="header-search-dropdown">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="header-search-result-item"
                  onClick={() => navigate(`/profile/${result.id}`)}
                >
                  <img
                    src={result.photoURL || defaultProfilePic}
                    alt={result.username}
                  />
                  <span>{result.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <nav className="header-nav">
          <Link className="header-button" to="/explore-posts">
            Explorar
          </Link>
          <Link className="header-button" to="/exploreServices">
            Servicios
          </Link>
          <Link className="header-button" to="/explore-users">
            Usuarios
          </Link>
          {user ? (
            <>
              {/* Eliminado el botón "Crear Publicación" */}
              <div
                className="header-notifications"
                onClick={toggleNotifications}
                ref={notificationsRef}
              >
                <div
                  className={`header-notifications-icon ${
                    animateBell ? 'notification-bounce' : ''
                  }`}
                >
                  <FaBell
                    size={28}
                    color={hasNotifications ? '#ff1493' : '#000'}
                  />
                  {hasNotifications && (
                    <span className="header-notifications-badge"></span>
                  )}
                </div>
                {notificationsVisible && (
                  <div className="header-notifications-dropdown visible">
                    <Notifications />
                  </div>
                )}
              </div>
              <div
                className="header-user"
                onClick={toggleDropdown}
                ref={dropdownRef}
              >
                <img
                  src={profilePic}
                  alt="Profile"
                  className="header-profile-pic"
                />
                <span className="header-username">{user.username}</span>
                {dropdownVisible && (
                  <div className="header-dropdown visible">
                    <div
                      className="header-dropdown-item balance"
                      onClick={handleAddBalanceClick}
                    >
                      Balance: {balance.toFixed(2)}$ <FaPlus />
                    </div>
                    <div className="header-dropdown-item pending">
                      Pendiente: {pendingBalance.toFixed(2)}$
                    </div>
                    <Link
                      to={`/profile/${user.uid}`}
                      className="header-dropdown-item"
                    >
                      Perfil
                    </Link>
                    <Link
                      to="/workbench"
                      className="header-dropdown-item"
                    >
                      Mesa de trabajo
                    </Link>
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin-dashboard"
                        className="header-dropdown-item"
                      >
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="header-dropdown-item"
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to="/configuration"
                      className="header-dropdown-item"
                    >
                      Configuración
                    </Link>
                    <Link
                      to="/donations"
                      className="header-dropdown-item"
                    >
                      Donaciones
                    </Link>
                    <div
                      className="header-dropdown-item"
                      onClick={handleMembershipClick}
                    >
                      Membresía
                    </div>
                    <button
                      onClick={handleLogout}
                      className="header-dropdown-item logout-button"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="header-buttons">
              <Link to="/login" className="header-button">
                Log In
              </Link>
              <Link to="/register" className="header-button">
                Register
              </Link>
            </div>
          )}
        </nav>
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menú Móvil */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'visible' : ''}`}>
        <div className="mobile-search-bar">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <FaSearch className="search-icon" />
        </div>
        <Link
          to="/explore-posts"
          className="mobile-menu-item"
          onClick={() => setMobileMenuOpen(false)}
        >
          Explorar
        </Link>
        <Link
          to="/exploreServices"
          className="mobile-menu-item"
          onClick={() => setMobileMenuOpen(false)}
        >
          Servicios
        </Link>
        <Link
          to="/explore-users"
          className="mobile-menu-item"
          onClick={() => setMobileMenuOpen(false)}
        >
          Usuarios
        </Link>
        {user ? (
          <>
            <Link
              to={`/profile/${user.uid}`}
              className="mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              Perfil
            </Link>
            <Link
              to="/workbench"
              className="mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mesa de trabajo
            </Link>
            {user.role === 'admin' ? (
              <Link
                to="/admin-dashboard"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/configuration"
              className="mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              Configuración
            </Link>
            <Link
              to="/donations"
              className="mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              Donaciones
            </Link>
            <button
              className="mobile-menu-item"
              onClick={() => {
                handleMembershipClick();
                setMobileMenuOpen(false);
              }}
            >
              Membresía
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="mobile-menu-item logout-button"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="mobile-menu-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              Register
            </Link>
          </>
        )}
      </div>

      {/* Modal para Agregar Balance */}
      {showAddBalanceModal && (
        <AddBalanceModal
          onClose={() => setShowAddBalanceModal(false)}
          onAddBalance={handleAddBalance}
        />
      )}

      {/* Modal para Membresía */}
      {showMembershipModal && (
        <Membership onClose={handleMembershipClose} />
      )}
    </header>
  );
}
