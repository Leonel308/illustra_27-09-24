import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './ProfileFeed.css';

const ProfileFeed = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', userId));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => doc.data());
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching activities: ", error);
        setError('Error fetching activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="tab-content">
      <h3>Actividades</h3>
      {activities.length === 0 ? (
        <p>No disponible, seguimos trabajando!</p>
      ) : (
        activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <p>{activity.description}</p>
            <span>{new Date(activity.timestamp).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfileFeed;