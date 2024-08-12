import React, { useContext, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ImageCropperModal from './ImageCropperModal';
import '../../Styles/ProfileStyles/ProfilePicture.css';

const ProfilePicture = ({ photoURL, isOwner, setPhotoURL, setError }) => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleProfilePicChange = (e) => {
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
        const profilePicRef = ref(storage, `profilePics/${user.uid}`);
        await uploadBytes(profilePicRef, croppedFile);
        const newPhotoURL = await getDownloadURL(profilePicRef);
        setPhotoURL(newPhotoURL);
        await updateDoc(doc(db, 'users', user.uid), { photoURL: newPhotoURL });
      } catch (error) {
        console.error("Error uploading profile picture: ", error);
        setError('Error uploading profile picture. Please try again.');
      } finally {
        setShowModal(false);
      }
    }
  };

  return (
    <div className="profile-pic-container">
      <div
        className={`profile-pic ${isOwner ? 'clickable' : ''}`}
        onClick={isOwner ? () => document.getElementById('profilePicInput').click() : undefined}
      >
        <img src={photoURL} alt="Profile" />
        {isOwner && (
          <>
            <input type="file" accept="image/*" id="profilePicInput" className="profile-pic-input" onChange={handleProfilePicChange} />
            <div className="profile-pic-overlay">Actualizar Foto</div>
          </>
        )}
      </div>

      {showModal && (
        <ImageCropperModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCroppedImage}
          imageSrc={imageSrc}
          aspect={1 / 1} // Relación de aspecto 1:1 para la imagen de perfil
        />
      )}
    </div>
  );
};

export default ProfilePicture;