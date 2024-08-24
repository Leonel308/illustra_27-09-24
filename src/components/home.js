import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../Styles/Home.css';
import FeaturedUsers from './FeaturedUsers';
import RecomendedPosts from './RecomendedPosts';

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

      <div className="home-featured-users">
        <h2 className="home-featured-title">Usuarios Destacados</h2>
        <FeaturedUsers />
      </div>

      <div className="home-recommended-posts">
        <h2>Publicaciones Recomendadas</h2>
        <RecomendedPosts collectionName="PostsCollection" category="SFW" />
      </div>

      <div className="home-how-it-works">
        <h2>¿Cómo funciona Illustra?</h2>
        <div className="home-steps-container">
          {[
            { title: "Crea tu cuenta", description: "Regístrate y personaliza tu perfil para comenzar a mostrar tu talento al mundo.", icon: "/createAccount.png" },
            { title: "Crea contenido", description: "Comparte tus ilustraciones y proyectos. Publica en redes sociales para que más personas vean tu trabajo.", icon: "/pen.png" },
            { title: "Genera ingresos", description: "Ofrece tus comisiones como ilustrador a todos los usuarios. Demuestra tu talento y conviértelo en ingresos.", icon: "/money.png" },
            { title: "Contrata a expertos", description: "Contrata a nuestros talentosos ilustradores para dar vida a tus ideas y proyectos con sus habilidades excepcionales.", icon: "/handshake.png" },
          ].map((step, index) => (
            <div key={index} className="home-step">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <img src={step.icon} alt={step.title} className="home-step-icon" />
            </div>
          ))}
        </div>
      </div>

      <footer className="home-footer">
        <p>© 2024 Illustra. Todos los derechos reservados.</p>
        <p>Contact: <a href="mailto:support@illustra.app">support@illustra.app</a></p>
      </footer>
    </div>
  );
};

export default Home;