import React, { useState, useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ImageCropperModal from './ImageCropperModal';
import './ProfilePicture.css';

const ProfilePicture = ({ photoURL, isOwner, setPhotoURL, setError }) => {
  const { user } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);

  const handleSaveCroppedImage = async (file) => {
    const profilePicRef = ref(storage, `profilePics/${user.uid}`);
    await uploadBytes(profilePicRef, file);
    const newPhotoURL = await getDownloadURL(profilePicRef);
    setPhotoURL(newPhotoURL);
    await updateDoc(doc(db, 'users', user.uid), { photoURL: newPhotoURL });
  };

  return (
    <div className="profile-pic-container">
      <div className={`profile-pic ${isOwner ? 'clickable' : ''}`} onClick={isOwner ? () => setShowModal(true) : undefined}>
        <img src={photoURL} alt="Profile" />
        {isOwner && <div className="profile-pic-overlay">Actualizar Foto</div>}
      </div>

      <ImageCropperModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCroppedImage}
      />
    </div>
  );
};

export default ProfilePicture;
