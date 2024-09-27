// src/components/HomeComponents/Profile.js

import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ProfileBio from './ProfileBio';
import ProfilePortfolio from './ProfilePortfolio';
import ProfileServices from './ProfileServices';
import ProfileBackground from './ProfileBackground';
import ProfilePicture from './ProfilePicture';
import styles from '../../Styles/ProfileStyles/Profile.module.css';

const DEFAULT_PROFILE_PIC = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Profile = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams();
  const [profileData, setProfileData] = useState({
    photoURL: DEFAULT_PROFILE_PIC,
    bio: '',
    portfolio: [],
    services: [],
    username: '',
    isArtist: false,
    gender: '',
    adultContent: 'SFW',
    backgroundURL: ''
  });
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData(prevData => ({
            ...prevData,
            ...userData,
            photoURL: userData.photoURL || DEFAULT_PROFILE_PIC
          }));
          setIsOwner(user?.uid === userId);
        } else {
          setError('Usuario no encontrado');
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario: ", error);
        setError('Error al cargar los datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user, userId]);

  // Memoizar el label del artista para evitar cálculos innecesarios
  const getArtistLabel = useMemo(() => {
    const { isArtist, gender } = profileData;
    if (isArtist) {
      return gender === 'female' ? 'ilustradora' : gender === 'other' ? 'ilustrador/a' : 'ilustrador';
    }
    return gender === 'female' ? 'usuaria' : gender === 'other' ? 'usuario/a' : 'usuario';
  }, [profileData]);

  // Manejar la actualización de la imagen de fondo
  const handleSaveBackground = useCallback(async (backgroundURL) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { backgroundURL });
      setProfileData(prevData => ({ ...prevData, backgroundURL }));
    } catch (error) {
      console.error("Error al actualizar la imagen de fondo: ", error);
      setError('Error al actualizar la imagen de fondo');
    }
  }, [userId]);

  // Manejar la actualización de la imagen de perfil
  const handleUpdateProfilePicture = useCallback((newPhotoURL) => {
    setProfileData(prevData => ({ ...prevData, photoURL: newPhotoURL }));
  }, []);

  // Toggle de la barra lateral en dispositivos móviles
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return <div className={styles.loadingSpinner} role="status" aria-live="polite">Cargando...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage} role="alert">{error}</div>;
  }

  return (
    <div 
      className={styles.profilePageContainer} 
      style={{ backgroundImage: `url(${profileData.backgroundURL})` }}
      role="main"
    >
      {/* Botón para toggle de sidebar en móviles */}
      <button 
        className={styles.sidebarToggle} 
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <div className={styles.profileContent}>
        {/* Barra Lateral (Sidebar) */}
        <aside 
          className={`${styles.profileSidebar} ${isSidebarOpen ? styles.active : ''}`} 
          aria-hidden={!isSidebarOpen}
        >
          <div className={styles.sidebarContent}>
            <header className={styles.profileHeader}>
              <ProfilePicture 
                photoURL={profileData.photoURL} 
                isOwner={isOwner} 
                setPhotoURL={handleUpdateProfilePicture} 
              />
              <h2 className={styles.username}>{profileData.username}</h2>
              <p className={styles.userRole}>
                {profileData.isArtist ? '🖌️' : '👤'} {getArtistLabel}
              </p>
              <p className={styles.contentType}>
                🎨 Contenido: {profileData.adultContent}
              </p>
            </header>

            {/* Bio del Perfil */}
            <ProfileBio
              bio={profileData.bio}
              isOwner={isOwner}
              setBio={(newBio) => setProfileData(prevData => ({ ...prevData, bio: newBio }))}
              userId={userId}
            />

            {/* Imagen de Fondo (Editable solo por el propietario) */}
            {isOwner && (
              <div className={styles.profileBackgroundContainer}>
                <ProfileBackground onSave={handleSaveBackground} />
              </div>
            )}
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className={styles.profileMainContent}>
          {/* Sección de Servicios */}
          <section className={styles.profileSection} aria-labelledby="services-section">
            <h3 id="services-section">Servicios</h3>
            <ProfileServices 
              services={profileData.services} 
              isOwner={isOwner} 
              userId={userId} 
            />
          </section>

          {/* Sección de Portfolio */}
          <section className={styles.profileSection} aria-labelledby="portfolio-section">
            <h3 id="portfolio-section">Portfolio</h3>
            <ProfilePortfolio 
              portfolio={profileData.portfolio} 
              isOwner={isOwner} 
              userId={userId} 
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;
