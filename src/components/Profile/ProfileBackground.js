import React, { useState, useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import ImageCropperModal from './ImageCropperModal';
import './ProfileBackground.css';

const ProfileBackground = ({ backgroundURL, isOwner, setBackgroundURL, setError }) => {
  const { user } = useContext(UserContext);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [file, setFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setFile(selectedFile);
        setShowCropper(true);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleImageCrop = async (croppedImageBlob) => {
    if (croppedImageBlob && user) {
      try {
        const fileExtension = file.name.split('.').pop();
        const croppedImage = new File([croppedImageBlob], `cropped.${fileExtension}`, { type: 'image/jpeg' });
        
        const storageRef = ref(storage, `backgrounds/${user.uid}.${fileExtension}`);
        await uploadBytes(storageRef, croppedImage);
        const downloadURL = await getDownloadURL(storageRef);
        setBackgroundURL(downloadURL);
        await updateDoc(doc(db, 'users', user.uid), { backgroundURL: downloadURL });
        setShowCropper(false);
      } catch (error) {
        console.error("Error uploading background: ", error);
        setError('Error uploading background. Please try again.');
      }
    }
  };

  return (
    <div
      className="profile-background"
      style={{ backgroundImage: `url(${backgroundURL})` }}
      onMouseEnter={() => setShowUploadButton(true)}
      onMouseLeave={() => setShowUploadButton(false)}
    >
      {isOwner && showUploadButton && (
        <>
          <label htmlFor="background-upload" className="background-upload-label">
            Actualizar Fondo
          </label>
          <input
            type="file"
            id="background-upload"
            className="background-upload-input"
            onChange={handleFileChange}
            accept="image/*"
          />
        </>
      )}
      {showCropper && (
        <ImageCropperModal
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
          onSave={handleImageCrop}
          imageSrc={imageSrc}
          aspect={4 / 1} // Relación de aspecto 4:1 para la imagen de fondo
          cropWidth={1600}
          cropHeight={400}
        />
      )}
    </div>
  );
};

export default ProfileBackground;
