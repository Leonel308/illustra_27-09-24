import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import '../Styles/Home.css';
import LeftSideBar from './HomeComponents/LeftSideBar';
import RightSidebar from './HomeComponents/RightSideBar';
import Feed from '../components/Feed/Feed';
import WelcomeBox from './HomeComponents/WelcomeBox';
import LoadingSpinner from './HomeComponents/LoadingSpinner';
import Footer from './HomeComponents/Footer';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [filters, setFilters] = useState({
    showNSFW: false,
    activeFilters: [],
    searchTerm: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUser({ ...currentUser, ...userDoc.data() });
          } else {
            console.log('No such document!');
            setUser(currentUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPortfolioImages = async () => {
      setPortfoliosLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const allImages = [];

        usersSnapshot.forEach((userDoc) => {
          const portfolio = userDoc.data().portfolio;
          if (Array.isArray(portfolio)) {
            portfolio.forEach((imageObj) => {
              allImages.push(typeof imageObj === 'string' ? imageObj : imageObj.url);
            });
          }
        });

        setPortfolioImages(allImages);
      } catch (error) {
        console.error("Error fetching portfolio images:", error);
      }
      setPortfoliosLoading(false);
    };

    fetchPortfolioImages();
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  if (loading || portfoliosLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="home-container">
      <div className="welcome-box-wrapper">
        <WelcomeBox portfolioImages={portfolioImages} user={user} />
      </div>
      <div className="home-content-wrapper">
        <div className="home-main-content">
          <LeftSideBar onFilterChange={handleFilterChange} />
          <div className="feed-container">
            <h2>Feed de Publicaciones</h2>
            {!user ? (
              <div className="feed-warning">
                Para ver el contenido debes <button onClick={() => navigate('/register')} className="link-button">registrarte</button> o <button onClick={() => navigate('/login')} className="link-button">iniciar sesión</button>.
              </div>
            ) : (
              <Feed filters={filters} />
            )}
          </div>
          <RightSidebar />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;