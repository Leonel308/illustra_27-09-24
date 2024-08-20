import React, { useEffect, useState, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import UserContext from '../context/UserContext';
import '../Styles/Notifications.css';

const Notifications = () => {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const notificationsRef = collection(db, 'users', user.uid, 'Notifications');
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(fetchedNotifications);

        // Calculate the number of unread notifications
        const unreadNotifications = fetchedNotifications.filter(notification => !notification.read);
        setUnreadCount(unreadNotifications.length);

        // Trigger the bell effect if there are new unread notifications
        if (unreadNotifications.length > 0) {
          triggerBellEffect();
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    const notificationRef = doc(db, 'users', user.uid, 'Notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
    setUnreadCount(unreadCount - 1);
  };

  const clearNotifications = async () => {
    const batch = notifications.map(async (notification) => {
      const notificationRef = doc(db, 'users', user.uid, 'Notifications', notification.id);
      await deleteDoc(notificationRef);
    });
    await Promise.all(batch);
    setNotifications([]);
    setUnreadCount(0);
  };

  const triggerBellEffect = () => {
    const bell = document.querySelector('.notification-bell');
    if (bell) {
      bell.classList.add('shake');
      setTimeout(() => {
        bell.classList.remove('shake');
      }, 500);
    }
  };

  return (
    <div 
      className={`notifications-container ${isVisible ? 'visible' : ''}`} 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
    >
      <h2>Notificaciones</h2>
      {notifications.length > 0 ? (
        <div>
          <ul className="notifications-list">
            {notifications.map(notification => (
              <li key={notification.id} className="notification-item">
                <strong>{notification.title}</strong>
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
          <button className="clear-button" onClick={clearNotifications}>Limpiar</button>
        </div>
      ) : (
        <p>No tienes notificaciones.</p>
      )}
    </div>
  );
};

export default Notifications;
