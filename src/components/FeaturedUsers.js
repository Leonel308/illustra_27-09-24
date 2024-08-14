import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import '../Styles/FeaturedUsers.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const FeaturedUsers = () => {
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.photoURL && user.bio);
        const shuffledUsers = usersList.sort(() => 0.5 - Math.random());
        setFeaturedUsers(shuffledUsers.slice(0, 10));
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchFeaturedUsers();
  }, []);

  const truncateBio = (bio) => {
    return bio.length > 120 ? bio.substring(0, 120) + '...' : bio;
  };

  return (
    <div className="featured-container">
      <div className="featured-header">
        <h3>Usuarios Destacados</h3>
      </div>
      <div className="featured-users-container">
        <button className="featured-arrow-button left" onClick={() => {
          const container = document.querySelector('.featured-users-grid');
          container.scrollBy({ left: -200, behavior: 'smooth' });
        }}>
          &lt;
        </button>
        <div className="featured-users-grid">
          {featuredUsers.map((user, index) => (
            <div key={index} className="featured-user-card" onClick={() => navigate(`/profile/${user.id}`)}>
              <img src={user.photoURL || defaultProfilePic} alt={user.username} />
              <h3>{user.username}</h3>
              <p>{truncateBio(user.bio)}</p>
            </div>
          ))}
        </div>
        <button className="featured-arrow-button right" onClick={() => {
          const container = document.querySelector('.featured-users-grid');
          container.scrollBy({ left: 200, behavior: 'smooth' });
        }}>
          &gt;
        </button>
      </div>
    </div>
  );
};

export default FeaturedUsers;
