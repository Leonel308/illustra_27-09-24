import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../Styles/Home.css';
import LeftSidebar from './HomeComponents/LeftSideBar';
import RightSidebar from './HomeComponents/RightSideBar';
import Feed from '../components/Feed/Feed';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNSFW, setShowNSFW] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            console.log('User Data:', userDoc.data());
            setUser({ ...user, ...userDoc.data() });
          } else {
            console.log('No such document!');
            setUser(user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFilterChange = useCallback(({ showNSFW, activeFilters }) => {
    setShowNSFW(showNSFW);
    setActiveFilters(activeFilters);
  }, []);

  const renderLoadingSpinner = () => (
    <div className="home-loading-container">
      <div className="home-spinner"></div>
      <p>Cargando Illustra...</p>
    </div>
  );

  const renderWelcomeBox = () => (
    <div className="home-welcome-box">
      <h2>¡Descubre Illustra!</h2>
      <p>Illustra es una plataforma que conecta artistas y clientes. Contrata servicios de artistas y ofrece tus propios servicios. ¡Comparte y promociona tus ilustraciones!</p>
      {!user && (
        <div className="home-create-account-box">
          <h3>Crea tu cuenta</h3>
          <p>Regístrate y personaliza tu perfil para comenzar a mostrar tu talento al mundo.</p>
          <button 
            className="cta-button register-button" 
            onClick={() => navigate('/register')}
          >
            ¡Regístrate ahora!
          </button>
        </div>
      )}
    </div>
  );

  const renderMainContent = () => (
    <div className="home-main-content">
      <LeftSidebar onFilterChange={handleFilterChange} />
      <div className="feed-container">
        <h2>Feed de Publicaciones</h2>
        {!user ? (
          <div className="feed-warning">
            Para ver el contenido debes <button onClick={() => navigate('/register')} className="link-button">registrarte</button> o <button onClick={() => navigate('/login')} className="link-button">iniciar sesión</button>.
          </div>
        ) : (
          <Feed showNSFW={showNSFW} activeFilters={activeFilters} userId={user?.uid} />
        )}
      </div>
      <RightSidebar />
    </div>
  );

  if (loading) {
    return renderLoadingSpinner();
  }

  return (
    <div className="home-container">
      {renderWelcomeBox()}
      {renderMainContent()}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} Illustra. Todos los derechos reservados.</p>
        <p>Contact: <a href="mailto:support@illustra.app">support@illustra.app</a></p>
      </footer>
    </div>
  );
};

export default Home;