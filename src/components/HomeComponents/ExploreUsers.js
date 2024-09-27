import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './ExploreUsers.css';

const ExploreUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="explore-users">
      <button onClick={() => navigate('/')} className="back-button">
        <ArrowLeft className="button-icon" />
        Volver
      </button>
      <h1 className="explore-users-title">Explora Usuarios</h1>
      <div className="users-grid">
        {users
          .filter((user) => user.username) // Filtrar los usuarios sin username
          .map((user) => (
            <div key={user.id} className="user-card">
              <img
                src={user.photoURL || 'https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/default_pic.png?alt=media&token=7e02672b-6c59-4018-88bb-667c99007af4'}
                alt={user.username}
                className="user-avatar"
              />
              <div className="user-info">
                <h2 className="user-name">{user.username}</h2>
                <p className="user-bio">{user.bio || 'Sin biografía disponible'}</p>
                <button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="view-profile-button"
                >
                  Ver perfil
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ExploreUsers;
