import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import '../Styles/Home.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          console.log('User Data:', userDoc.data());
        }
        setUser(user);
        fetchFeaturedUsers();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchFeaturedUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.photoURL && user.bio);
      const shuffledUsers = usersList.sort(() => 0.5 - Math.random());
      const limitedUsers = shuffledUsers.slice(0, 10);

      console.log('Featured Users:', limitedUsers);
      setFeaturedUsers(limitedUsers);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  const truncateBio = (bio) => {
    return bio.length > 120 ? bio.substring(0, 120) + '...' : bio;
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  const handleSfwClick = () => {
    if (!user) {
      setShowPopup(true);
    } else {
      navigate('/explore-posts');
    }
  };

  const handleNsfwClick = () => {
    if (!user) {
      setShowPopup(true);
    } else {
      navigate('/explore-posts-mature');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-welcome-box">
        <h2>¡Descubre Illustra!</h2>
        <div className="publications-links">
          <div className="category-link" onClick={handleSfwClick}>Publicaciones SFW</div>
          <div className="category-link" onClick={handleNsfwClick}>Publicaciones NSFW</div>
        </div>
        <p>Illustra es una plataforma que conecta artistas y clientes. Contrata servicios de artistas y ofrece tus propios servicios. ¡Comparte y promociona tus ilustraciones!</p>
        {!user && (
          <div className="create-account-box" onClick={() => navigate('/register')}>
            <h3>Crea tu cuenta</h3>
            <p>Regístrate y personaliza tu perfil para comenzar a mostrar tu talento al mundo.</p>
          </div>
        )}
      </div>

      <div className="how-it-works">
        <h2>¿Cómo funciona Illustra?</h2>
        <div className="steps-container">
          <div className="step">
            <h3>Crea tu cuenta</h3>
            <p>Regístrate y personaliza tu perfil para comenzar a mostrar tu talento al mundo.</p>
            <img src="/createAccount.png" alt="Crear cuenta" className="step-icon" />
          </div>
          <div className="step">
            <h3>Crea contenido</h3>
            <p>Comparte tus ilustraciones y proyectos. Publica en redes sociales para que más personas vean tu trabajo.</p>
            <img src="/pen.png" alt="Crear contenido" className="step-icon" />
          </div>
          <div className="step">
            <h3>Genera ingresos</h3>
            <p>Ofrece tus comisiones como ilustrador a todos los usuarios. Demuestra tu talento y conviértelo en ingresos.</p>
            <img src="/money.png" alt="Genera ingresos" className="step-icon" />
          </div>
          <div className="step">
            <h3>Contrata a expertos</h3>
            <p>Contrata a nuestros talentosos ilustradores para dar vida a tus ideas y proyectos con sus habilidades excepcionales.</p>
            <img src="/handshake.png" alt="Contrata expertos" className="step-icon" />
          </div>
        </div>
        <div className="featured-header">
          <h3>Destacados</h3>
          <button className="view-all-button" onClick={() => navigate('/all-users')}>Ver todo</button>
        </div>
        <div className="users-grid">
          {featuredUsers.map((featuredUser, index) => (
            <div key={index} className="user-card" onClick={() => navigate(`/profile/${featuredUser.id}`)}>
              <img src={featuredUser.photoURL || defaultProfilePic} alt={featuredUser.username} />
              <h3>{featuredUser.username}</h3>
              <p>{truncateBio(featuredUser.bio)}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>© 2024 Illustra. Todos los derechos reservados.</p>
      </footer>

      {showPopup && (
        <div className="popup-container">
          <div className="popup">
            <h3>Advertencia</h3>
            <p>Necesitas estar registrado para acceder a esta sección.</p>
            <div className="popup-buttons">
              <button onClick={() => navigate('/register')}>Registrarse</button>
              <button onClick={() => navigate('/login')}>Log in</button>
            </div>
            <button className="close-button" onClick={handlePopupClose}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
