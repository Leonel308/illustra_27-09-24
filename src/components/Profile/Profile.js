import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import ProfileBio from './ProfileBio';
import ProfilePortfolio from './ProfilePortfolio';
import ProfileServices from './ProfileServices';
import ProfileBackground from './ProfileBackground';
import '../../Styles/ProfileStyles/profile.css';

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

  const getArtistLabel = () => {
    if (profileData.isArtist) {
      return profileData.gender === 'female' ? 'ilustradora' : profileData.gender === 'other' ? 'ilustrador/a' : 'ilustrador';
    } else {
      return profileData.gender === 'female' ? 'usuaria' : profileData.gender === 'other' ? 'usuario/a' : 'usuario';
    }
  };

  const handleSaveBackground = async (backgroundURL) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { backgroundURL }); // Guarda la URL de la imagen de fondo
      setProfileData(prev => ({ ...prev, backgroundURL }));
    } catch (error) {
      console.error("Error updating background image: ", error);
    }
  };

  return (
    <div className="profile-page-container" style={{ backgroundImage: `url(${profileData.backgroundURL})` }}>
      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-header">
            <img src={profileData.photoURL} alt={profileData.username} className="profile-picture" />
            <h2>{profileData.username}</h2>
            <p className="user-role">
              {profileData.isArtist ? '🖌️' : '👤'} {getArtistLabel()}
            </p>
            <p className="content-type">
              🎨 Contenido: {profileData.adultContent}
            </p>
          </div>
          <div className="profile-bio">
            <ProfileBio bio={profileData.bio} isOwner={isOwner} setBio={(newBio) => setProfileData(prev => ({ ...prev, bio: newBio }))} userId={userId} />
          </div>
          {isOwner && <ProfileBackground onSave={handleSaveBackground} />}
        </div>
        <div className="profile-main-content">
          <div className="profile-section services-section">
            <h3>Servicios</h3>
            <ProfileServices services={profileData.services} isOwner={isOwner} userId={userId} />
          </div>
          <div className="profile-section portfolio-section">
            <h3>Portfolio</h3>
            <ProfilePortfolio portfolio={profileData.portfolio} isOwner={isOwner} userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
