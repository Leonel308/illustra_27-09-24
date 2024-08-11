import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../../Styles/ProfileStyles/profile.css';
import UserContext from '../../context/UserContext';
import ProfileBanner from './ProfileBanner';
import ProfilePicture from './ProfilePicture';
import ProfileBio from './ProfileBio';
import ProfileTabs from './ProfileTabs';
import ProfilePortfolio from './ProfilePortfolio';
import ProfileFeed from './ProfileFeed';
import ProfileFriends from './ProfileFriends';
import ProfileServices from './ProfileServices';
import DonateButton from '../DonateButton'; // Asegúrate de importar correctamente

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Profile = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bannerURL, setBannerURL] = useState('');
  const [photoURL, setPhotoURL] = useState(defaultProfilePic);
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [username, setUsername] = useState('');
  const [adultContent, setAdultContent] = useState('');
  const [isArtist, setIsArtist] = useState(false);
  const [gender, setGender] = useState('');
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [donationAmounts, setDonationAmounts] = useState([1000, 5000, 10000, 20000]);
  const [canReceiveDonations, setCanReceiveDonations] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBannerURL(data.bannerURL || '');
          setPhotoURL(data.photoURL || defaultProfilePic);
          setBio(data.bio || '');
          setPortfolio(data.portfolio || []);
          setServices(data.services || []);
          setUsername(data.username || '');
          setAdultContent(data.adultContent === 'NSFW-SFW' ? 'SFW/NSFW' : data.adultContent || '');
          setIsOwner(user && user.uid === userId);
          setIsArtist(data.isArtist || false);
          setGender(data.gender || '');
          setDonationAmounts(data.donationAmounts || [1000, 5000, 10000, 20000]);
          setCanReceiveDonations(!!data.mercadoPagoAccessToken);
        } else {
          setError('User not found');
          navigate('/home');
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
        setError('Error fetching user data');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, userId, navigate]);

  const handleSponsorClick = () => {
    setShowSponsorModal(true);
  };

  const handleCloseSponsorModal = () => {
    setShowSponsorModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <ProfileBanner
          bannerURL={bannerURL}
          isOwner={isOwner}
          setBannerURL={setBannerURL}
          setError={setError}
        />
        <ProfilePicture
          photoURL={photoURL}
          isOwner={isOwner}
          setPhotoURL={setPhotoURL}
          setError={setError}
        />
        <div className="user-info">
          <h2>{username}</h2>
          {isArtist ? (
            <p className="artist-label">ilustrador{gender === 'female' ? 'a' : gender === 'other' ? 'x' : ''} {adultContent}</p>
          ) : (
            <p className="artist-label">usuario</p>
          )}
        </div>

        <div className="sponsor-box" onClick={handleSponsorClick} style={{ pointerEvents: isOwner || !canReceiveDonations ? 'none' : 'auto', opacity: isOwner || !canReceiveDonations ? 0.5 : 1 }}>
          Patrocinar
        </div>

        {showSponsorModal && (
          <div className="sponsor-modal">
            <div className="sponsor-modal-content">
              <span className="close" onClick={handleCloseSponsorModal}>&times;</span>
              <h2>Selecciona un monto para donar</h2>
              {donationAmounts.map((amount, index) => (
                <DonateButton
                  key={index}
                  amount={amount}
                  description={`Donación a ${username}`}
                  payerEmail={user.email}
                />
              ))}
            </div>
          </div>
        )}

        <ProfileBio
          bio={bio}
          isOwner={isOwner}
          setBio={setBio}
          setError={setError}
        />
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === 'services' && (
          <ProfileServices
            services={services}
            isOwner={isOwner}
            setServices={setServices}
          />
        )}
        {activeTab === 'portfolio' && <ProfilePortfolio portfolio={portfolio} isOwner={isOwner} setPortfolio={setPortfolio} setError={setError} />}
        {activeTab === 'feed' && <ProfileFeed userId={userId} />}
        {activeTab === 'friends' && <ProfileFriends userId={userId} />}
      </div>
    </div>
  );
};

export default Profile;
