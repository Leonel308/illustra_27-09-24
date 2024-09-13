import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ProfileBio from './ProfileBio';
import ProfilePortfolio from './ProfilePortfolio';
import ProfileServices from './ProfileServices';
import ProfileBackground from './ProfileBackground';
import styles from '../../Styles/ProfileStyles/Profile.module.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Profile = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams();
  const [profileData, setProfileData] = useState({
    photoURL: defaultProfilePic,
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfileData({ ...userDoc.data(), photoURL: userDoc.data().photoURL || defaultProfilePic });
          setIsOwner(user && user.uid === userId);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };
    fetchUserData();
  }, [user, userId]);

  const getArtistLabel = useMemo(() => {
    if (profileData.isArtist) {
      return profileData.gender === 'female'
        ? 'ilustradora'
        : profileData.gender === 'other'
        ? 'ilustrador/a'
        : 'ilustrador';
    }
    return profileData.gender === 'female'
      ? 'usuaria'
      : profileData.gender === 'other'
      ? 'usuario/a'
      : 'usuario';
  }, [profileData.isArtist, profileData.gender]);

  const handleSaveBackground = useCallback(async (backgroundURL) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { backgroundURL });
      setProfileData((prev) => ({ ...prev, backgroundURL }));
    } catch (error) {
      console.error("Error updating background image: ", error);
    }
  }, [userId]);

  return (
    <div className={styles.profilePageContainer} style={{ backgroundImage: `url(${profileData.backgroundURL})` }}>
      <div className={styles.profileContent}>
        <aside className={styles.profileSidebar}>
          <header className={styles.profileHeader}>
            <img src={profileData.photoURL} alt={profileData.username} className={styles.profilePicture} />
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
            setBio={(newBio) => setProfileData((prev) => ({ ...prev, bio: newBio }))}
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
