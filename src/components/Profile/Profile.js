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
          setError('User not found');
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user, userId]);

  const getArtistLabel = useMemo(() => {
    const { isArtist, gender } = profileData;
    if (isArtist) {
      return gender === 'female' ? 'ilustradora' : gender === 'other' ? 'ilustrador/a' : 'ilustrador';
    }
    return gender === 'female' ? 'usuaria' : gender === 'other' ? 'usuario/a' : 'usuario';
  }, [profileData.isArtist, profileData.gender]);

  const handleSaveBackground = useCallback(async (backgroundURL) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { backgroundURL });
      setProfileData(prevData => ({ ...prevData, backgroundURL }));
    } catch (error) {
      console.error("Error updating background image: ", error);
      setError('Failed to update background image');
    }
  }, [userId]);

  const handleUpdateProfilePicture = useCallback((newPhotoURL) => {
    setProfileData(prevData => ({ ...prevData, photoURL: newPhotoURL }));
  }, []);

  if (isLoading) {
    return <div className={styles.loadingSpinner}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div className={styles.profilePageContainer} style={{ backgroundImage: `url(${profileData.backgroundURL})` }}>
      <div className={styles.profileContent}>
        <aside className={styles.profileSidebar}>
          <header className={styles.profileHeader}>
            <ProfilePicture 
              photoURL={profileData.photoURL} 
              isOwner={isOwner} 
              setPhotoURL={handleUpdateProfilePicture} 
            />
            <h2>{profileData.username}</h2>
            <p className={styles.userRole}>
              {profileData.isArtist ? '🖌️' : '👤'} {getArtistLabel}
            </p>
            <p className={styles.contentType}>
              🎨 Contenido: {profileData.adultContent}
            </p>
          </header>

          <ProfileBio
            bio={profileData.bio}
            isOwner={isOwner}
            setBio={(newBio) => setProfileData(prevData => ({ ...prevData, bio: newBio }))}
            userId={userId}
          />

          {isOwner && (
            <div className={styles.profileBackgroundContainer}>
              <ProfileBackground onSave={handleSaveBackground} />
            </div>
          )}
        </aside>

        <main className={styles.profileMainContent}>
          <section className={styles.profileSection}>
            <h3>Servicios</h3>
            <ProfileServices services={profileData.services} isOwner={isOwner} userId={userId} />
          </section>

          <section className={styles.profileSection}>
            <h3>Portfolio</h3>
            <ProfilePortfolio portfolio={profileData.portfolio} isOwner={isOwner} userId={userId} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;