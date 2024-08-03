import React, { useEffect, useState, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import UserContext from '../context/UserContext';
import '../Styles/Notifications.css';

const Notifications = () => {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      const notificationsRef = collection(db, 'users', user.uid, 'Notifications');
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));  // Ordena por timestamp en orden descendente
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(fetchedNotifications);

        // Eliminar notificaciones si hay más de 4
        if (fetchedNotifications.length > 4) {
          const excessNotifications = fetchedNotifications.slice(4); // Mantiene solo las 4 más recientes
          excessNotifications.forEach(async (notification) => {
            await deleteDoc(doc(db, 'users', user.uid, 'Notifications', notification.id));
          });
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    const notificationRef = doc(db, 'users', user.uid, 'Notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  return (
    <div className="notifications-container">
      <h2>Notificaciones</h2>
      {notifications.length > 0 ? (
        <ul className="notifications-list">
          {notifications.map(notification => (
            <li key={notification.id} className="notification-item">
              <p>{notification.message}</p>
              <small>{new Date(notification.timestamp?.seconds * 1000).toLocaleString()}</small>
              {!notification.read && (
                <button onClick={() => markAsRead(notification.id)} className="mark-as-read">
                Ok
              </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No tienes notificaciones.</p>
      )}
    </div>
  );
};

export default Notifications;
