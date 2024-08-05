import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setLoading(true);
      setError(null);

      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: currentUser.uid, ...userData });
          } else {
            setError('No se encontraron los datos del usuario.');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Hubo un problema al obtener los datos del usuario.');
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
