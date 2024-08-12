import React, { useContext, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ImageCropperModal from './ImageCropperModal';
import '../../Styles/ProfileStyles/ProfileBanner.css';

const ProfileBanner = ({ bannerURL, isOwner, setBannerURL, setError }) => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowModal(true);
      };
    }
  };

  const handleSaveCroppedImage = async (croppedFile) => {
    if (croppedFile && user) {
      try {
        const bannerRef = ref(storage, `banners/${user.uid}`);
        await uploadBytes(bannerRef, croppedFile);
        const newBannerURL = await getDownloadURL(bannerRef);
        setBannerURL(newBannerURL);
        await updateDoc(doc(db, 'users', user.uid), { bannerURL: newBannerURL });
      } catch (error) {
        console.error("Error uploading banner: ", error);
        setError('Error uploading banner. Please try again.');
      } finally {
        setShowModal(false);
      }
    }
  };

  return (
    <div className="banner-container">
      <div
        className={`banner ${isOwner ? 'clickable' : ''}`}
        style={{ backgroundImage: `url(${bannerURL})` }}
        onClick={isOwner ? () => document.getElementById('bannerInput').click() : undefined}
      >
        {isOwner && (
          <>
            <input type="file" accept="image/*" id="bannerInput" className="banner-input" onChange={handleBannerChange} />
            <div className="banner-overlay">Actualizar Banner</div>
          </>
        )}
      </div>

      {showModal && (
        <ImageCropperModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCroppedImage}
          imageSrc={imageSrc}
          aspect={4 / 1} // Relación de aspecto 4:1 para el banner
        />
      )}
    </div>
  );
};

export default ProfileBanner;