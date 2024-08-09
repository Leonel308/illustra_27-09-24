import React, { useState, useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ImageCropperModal from './ImageCropperModal';
import './ProfileBanner.css';

const ProfileBanner = ({ bannerURL, isOwner, setBannerURL, setError }) => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);

  const MIN_WIDTH = 1200;
  const MIN_HEIGHT = 300;

  const handleSaveCroppedImage = async (file) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      const width = img.width;
      const height = img.height;

      if (width < MIN_WIDTH || height < MIN_HEIGHT) {
        setError(`La imagen debe tener al menos ${MIN_WIDTH}x${MIN_HEIGHT} píxeles.`);
        return;
      }

      const bannerRef = ref(storage, `banners/${user.uid}`);
      await uploadBytes(bannerRef, file);
      const newBannerURL = await getDownloadURL(bannerRef);
      setBannerURL(newBannerURL);
      await updateDoc(doc(db, 'users', user.uid), { bannerURL: newBannerURL });
      setShowModal(false);
    };
  };

  return (
    <div className="banner-container">
      <div
        className={`banner ${isOwner ? 'clickable' : ''}`}
        style={{ backgroundImage: `url(${bannerURL})` }}
        onClick={isOwner ? () => setShowModal(true) : undefined}
      >
        {isOwner && <div className="banner-overlay">Actualizar Banner</div>}
      </div>

      <ImageCropperModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCroppedImage}
        aspectRatio={4 / 1}  // Cambia el aspect ratio para banners
        minCropBoxWidth={MIN_WIDTH}
        minCropBoxHeight={MIN_HEIGHT}
      />

      {isOwner && setError && <div className="warning-message">{setError}</div>}
    </div>
  );
};

export default ProfileBanner;
