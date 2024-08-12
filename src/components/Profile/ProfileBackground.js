import React, { useContext, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ImageCropperModal from './ImageCropperModal';
import './ProfileBackground.css';

const ProfileBackground = ({ backgroundURL, isOwner, setBackgroundURL, setError }) => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleBackgroundChange = (e) => {
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
        const backgroundRef = ref(storage, `backgrounds/${user.uid}`);
        await uploadBytes(backgroundRef, croppedFile);
        const newBackgroundURL = await getDownloadURL(backgroundRef);
        setBackgroundURL(newBackgroundURL);
        await updateDoc(doc(db, 'users', user.uid), { backgroundURL: newBackgroundURL });
      } catch (error) {
        console.error("Error uploading background: ", error);
        setError('Error uploading background. Please try again.');
      } finally {
        setShowModal(false);
      }
    }
  };

  return (
    <div className="background-container" style={{ backgroundImage: `url(${backgroundURL})` }}>
      {isOwner && (
        <>
          <input
            type="file"
            accept="image/*"
            id="backgroundInput"
            className="background-input"
            onChange={handleBackgroundChange}
          />
          <div className="background-overlay" onClick={() => document.getElementById('backgroundInput').click()}>
            Actualizar Fondo
          </div>
        </>
      )}
      
      {showModal && (
        <ImageCropperModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCroppedImage}
          imageSrc={imageSrc}
          aspect={16 / 9} // Relación de aspecto común para fondos (16:9)
        />
      )}
    </div>
  );
};

export default ProfileBackground;
