import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);

      if (currentUser) {
        try {
          // Obtener datos del usuario desde Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: currentUser.uid, ...userData });

            // Obtener el ID Token
            const token = await currentUser.getIdToken();
            console.log('AuthToken obtenido:', token);
            setAuthToken(token);
          } else {
            console.error('No se encontraron los datos del usuario en Firestore.');
            setError('No se encontraron los datos del usuario.');
            setUser(null);
            setAuthToken(null);
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario de Firestore:', error);
          setError('Hubo un problema al obtener los datos del usuario.');
          setUser(null);
          setAuthToken(null);
        }
      } else {
        console.log('No hay usuario autenticado.');
        setUser(null);
        setAuthToken(null);
      }

      setLoading(false);
    });

    // Listener para la renovación automática del ID Token
    const unsubscribeToken = auth.onIdTokenChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true); // Forzar renovación si es necesario
          console.log('AuthToken renovado:', token);
          setAuthToken(token);
        } catch (error) {
          console.error('Error al renovar el token de autenticación:', error);
          setAuthToken(null);
        }
      } else {
        console.log('No hay usuario para renovar el token.');
        setAuthToken(null);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, [auth]);

  return (
    <UserContext.Provider value={{ user, authToken, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
