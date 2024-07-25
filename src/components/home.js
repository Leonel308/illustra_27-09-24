import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import '../Styles/Main.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
        navigate('/login', { replace: true });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchFeaturedUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.photoURL && user.bio); // Filtra los usuarios sin foto de perfil o biografía
      const shuffledUsers = usersList.sort(() => 0.5 - Math.random());
      const limitedUsers = shuffledUsers.slice(0, 10);

      console.log('Featured Users:', limitedUsers);
      setFeaturedUsers(limitedUsers);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  const handleSearchChange = async (e) => {
    const queryText = e.target.value.trim(); // Eliminar espacios en blanco al inicio y final
    setSearchQuery(queryText);

    if (queryText) {
      try {
        const q = query(collection(db, 'users'), where('username', '>=', queryText), where('username', '<=', queryText + '\uf8ff'));
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users: ", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const truncateBio = (bio) => {
    return bio.length > 120 ? bio.substring(0, 120) + '...' : bio; // Cambiado a 120 caracteres
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
      <div className="home-search-container">
        <div className="search-categories">
          <Link to="/explore-posts" className="category-link">Publicaciones SFW</Link>
          <Link to="/explore-posts-mature" className="category-link">Publicaciones NSFW</Link> {/* Cambié la ruta aquí */}
        </div>
        <div className="home-welcome-box">
          <h2>Bienvenido a Illustra</h2>
          <h3>Explora a los artistas más vistos y encuentra inspiración en cada esquina</h3>
          {user ? (
            <p>¡Explora a los artistas más vistos!</p>
          ) : (
            <p>Únete a nuestra comunidad de ilustradores digitales. Por favor, <Link to="/register">regístrate</Link> o <Link to="/login">inicia sesión</Link> para continuar.</p>
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar..."
          className="home-search"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div key={index} className="search-result-item" onClick={() => navigate(`/profile/${result.id}`)}>
                <img src={result.photoURL || defaultProfilePic} alt={result.username} />
                <div className="search-result-info">
                  <h3>{result.username}</h3>
                  <p>{truncateBio(result.bio)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <main className="home-main">
        <div className="explore-posts-text" onClick={() => navigate('/explore-posts')}>
          ¡Explorar publicaciones!
        </div>
        {user && (
          <div className="featured-artists">
            {featuredUsers.map((featuredUser, index) => (
              <div key={index} className="featured-artist" onClick={() => navigate(`/profile/${featuredUser.id}`)}>
                <img src={featuredUser.photoURL || "https://via.placeholder.com/200"} alt={featuredUser.username} />
                <div className="featured-artist-info">
                  <h3>{featuredUser.username}</h3>
                  <p>{truncateBio(featuredUser.bio)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="footer">
        <p>© 2024 Illustra. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
