import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import '../Styles/sendNotification.css';

const SendNotification = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSendNotification = async () => {
    if (title.trim() === '' || message.trim() === '') {
      alert('Por favor, completa ambos campos.');
      return;
    }

    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const notificationData = {
        title: title,
        message: message,
        timestamp: new Date(),
        read: false,
      };

      const batch = usersSnapshot.docs.map(async (userDoc) => {
        const userNotificationsRef = collection(db, 'users', userDoc.id, 'Notifications');
        await addDoc(userNotificationsRef, notificationData);
      });

      await Promise.all(batch);

      setTitle('');
      setMessage('');
      alert('Notificación enviada a todos los usuarios.');
    } catch (error) {
      console.error('Error enviando la notificación:', error);
      alert('Ocurrió un error al enviar la notificación.');
    }
  };

  return (
    <div className="send-notification">
      <h2>Enviar Notificación</h2>
      <input
        type="text"
        placeholder="Título de la notificación (30 caracteres máx.)"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 30))}
      />
      <textarea
        placeholder="Mensaje de la notificación (60 caracteres máx.)"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 60))}
      />
      <button onClick={handleSendNotification}>Enviar Notificación</button>
    </div>
  );
};

export default SendNotification;
