import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './ProfileFriends.css';

const ProfileFriends = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsQuery = query(collection(db, 'friends'), where('userId', '==', userId));
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendsData = friendsSnapshot.docs.map(doc => doc.data());
        setFriends(friendsData);
      } catch (error) {
        console.error("Error fetching friends: ", error);
        setError('Error fetching friends. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="tab-content">
      <h3>Amigos/Seguidores</h3>
      {friends.length === 0 ? (
        <p>No disponible, seguimos trabajando!</p>
      ) : (
        friends.map((friend, index) => (
          <div key={index} className="friend-item">
            <p>{friend.username}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfileFriends;