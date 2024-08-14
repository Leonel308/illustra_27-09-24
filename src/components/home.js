import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../Styles/Home.css';
import FeaturedUsers from './FeaturedUsers';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-loading-container">
          <div className="home-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <FeaturedUsers />

      <div className="home-welcome-box">
        <h2>¡Descubre Illustra!</h2>
        <div className="home-publications-links">
          <div className="home-category-link" onClick={() => navigate('/explore-posts')}>Publicaciones SFW</div>
          <div className="home-category-link" onClick={() => navigate('/explore-posts-mature')}>Publicaciones NSFW</div>
        </div>
        <p>Illustra es una plataforma que conecta artistas y clientes. Contrata servicios de artistas y ofrece tus propios servicios. ¡Comparte y promociona tus ilustraciones!</p>
        {!user && (
          <div className="home-create-account-box" onClick={() => navigate('/register')}>
            <h3>Crea tu cuenta</h3>
            <p>Regístrate y personaliza tu perfil para comenzar a mostrar tu talento al mundo.</p>
          </div>
        )}
      </div>

      <div className="home-how-it-works">
        <h2>¿Cómo funciona Illustra?</h2>
        <div className="home-steps-container">
          <div className="home-step">
            <h3>Crea tu cuenta</h3>
            <p>Regístrate y personaliza tu perfil para comenzar a mostrar tu talento al mundo.</p>
            <img src="/createAccount.png" alt="Crear cuenta" className="home-step-icon" />
          </div>
          <div className="home-step">
            <h3>Crea contenido</h3>
            <p>Comparte tus ilustraciones y proyectos. Publica en redes sociales para que más personas vean tu trabajo.</p>
            <img src="/pen.png" alt="Crear contenido" className="home-step-icon" />
          </div>
          <div className="home-step">
            <h3>Genera ingresos</h3>
            <p>Ofrece tus comisiones como ilustrador a todos los usuarios. Demuestra tu talento y conviértelo en ingresos.</p>
            <img src="/money.png" alt="Genera ingresos" className="home-step-icon" />
          </div>
          <div className="home-step">
            <h3>Contrata a expertos</h3>
            <p>Contrata a nuestros talentosos ilustradores para dar vida a tus ideas y proyectos con sus habilidades excepcionales.</p>
            <img src="/handshake.png" alt="Contrata expertos" className="home-step-icon" />
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <p>© 2024 Illustra. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Home;
