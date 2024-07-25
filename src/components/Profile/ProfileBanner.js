import React, { useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import '../../Styles/ProfileStyles/ProfileBanner.css';

const ProfileBanner = ({ bannerURL, isOwner, setBannerURL, setError }) => {
  const { user } = useContext(UserContext);

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      try {
        const bannerRef = ref(storage, `banners/${user.uid}`);
        await uploadBytes(bannerRef, file);
        const newBannerURL = await getDownloadURL(bannerRef);
        setBannerURL(newBannerURL);
        await updateDoc(doc(db, 'users', user.uid), { bannerURL: newBannerURL });
      } catch (error) {
        console.error("Error uploading banner: ", error);
        setError('Error uploading banner. Please try again.');
      }
    }
  };

  return (
    <div className="banner-container">
      <div className={`banner ${isOwner ? 'clickable' : ''}`} style={{ backgroundImage: `url(${bannerURL})` }} onClick={isOwner ? () => document.getElementById('bannerInput').click() : undefined}>
        {isOwner && (
          <>
            <input type="file" accept="image/*" id="bannerInput" className="banner-input" onChange={handleBannerChange} />
            <div className="banner-overlay">Actualizar Banner</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileBanner;
