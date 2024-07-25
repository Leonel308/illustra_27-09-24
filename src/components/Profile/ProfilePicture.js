import React, { useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import '../../Styles/ProfileStyles/ProfilePicture.css';

const ProfilePicture = ({ photoURL, isOwner, setPhotoURL, setError }) => {
  const { user } = useContext(UserContext);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      try {
        const profilePicRef = ref(storage, `profilePics/${user.uid}`);
        await uploadBytes(profilePicRef, file);
        const newPhotoURL = await getDownloadURL(profilePicRef);
        setPhotoURL(newPhotoURL);
        await updateDoc(doc(db, 'users', user.uid), { photoURL: newPhotoURL });
      } catch (error) {
        console.error("Error uploading profile picture: ", error);
        setError('Error uploading profile picture. Please try again.');
      }
    }
  };

  return (
    <div className="profile-pic-container">
      <div className={`profile-pic ${isOwner ? 'clickable' : ''}`} onClick={isOwner ? () => document.getElementById('profilePicInput').click() : undefined}>
        <img src={photoURL} alt="Profile" />
        {isOwner && (
          <>
            <input type="file" accept="image/*" id="profilePicInput" className="profile-pic-input" onChange={handleProfilePicChange} />
            <div className="profile-pic-overlay">Actualizar Foto</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePicture;