import { db } from '../firebaseConfig';
import { doc, addDoc, collection } from 'firebase/firestore';

export const sendNotification = async ({ message, receiverId, senderId, title }) => {
  try {
    const notificationData = {
      message,
      read: false,
      receiverId,
      senderId,
      timestamp: new Date(),
      title,
    };

    // Agregar la notificación a la subcolección de 'Notifications' del usuario receptor
    await addDoc(collection(db, 'users', receiverId, 'Notifications'), notificationData);
    
    console.log('Notificación enviada exitosamente.');
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
};
