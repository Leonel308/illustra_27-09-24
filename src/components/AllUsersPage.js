import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import '../Styles/Home.css'; // Usa el mismo CSS que el Home para mantener la consistencia

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const AllUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          username: doc.data().username || 'Unknown User',
          photoURL: doc.data().photoURL || defaultProfilePic,
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
      <h2>Todos los Usuarios</h2>
      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card" onClick={() => navigate(`/profile/${user.id}`)}>
            <img src={user.photoURL} alt={user.username} />
            <h3>{user.username}</h3>
            <p>{user.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsersPage;
