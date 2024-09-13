import React, { useState, useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import ImageCropperModal from './ImageCropperModal';
import UserContext from '../../context/UserContext';
import styles from './ProfileBackground.module.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ProfileBackground = ({ currentBackgroundUrl, onSave }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewBackgroundUrl, setPreviewBackgroundUrl] = useState(currentBackgroundUrl);
  const { user } = useContext(UserContext);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Limitar el tamaño del archivo (por ejemplo, 5MB)
    if (file.size > MAX_FILE_SIZE) {
      alert('El tamaño máximo permitido es de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
      setIsCropperOpen(true); // Open the cropper modal when the file is ready
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedImage = (croppedBlob) => {
    setCroppedImageBlob(croppedBlob);
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPreviewBackgroundUrl(previewUrl);
    setIsCropperOpen(false);
  };

  const handleUpload = async () => {
    if (!croppedImageBlob || !user) return;

    setIsUploading(true);
    try {
      const uniqueImageName = `background_${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `backgrounds/${uniqueImageName}`);
      const croppedFile = new File([croppedImageBlob], uniqueImageName, {
        type: 'image/jpeg',
      });

      // Upload the cropped image to Firebase Storage
      await uploadBytes(storageRef, croppedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Call onSave with the new background URL
      onSave(downloadURL);
      setPreviewBackgroundUrl(downloadURL);
      setCroppedImageBlob(null);
    } catch (error) {
      console.error('Error uploading cropped image: ', error);
      alert('Hubo un error al subir la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.profileBackgroundContainer}>
      <div
        className={styles.profileBackground}
        style={{ backgroundImage: `url(${previewBackgroundUrl})` }}
      >
        <label className={styles.backgroundUploadLabel}>
          Cambiar Fondo
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.backgroundUploadInput}
          />
        </label>
      </div>

      {isCropperOpen && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          onSave={handleSaveCroppedImage}
          imageSrc={imageSrc}
          aspect={16 / 9} // Set the desired aspect ratio
        />
      )}

      {croppedImageBlob && (
        <button
          onClick={handleUpload}
          className={styles.saveButton}
          disabled={isUploading}
        >
          {isUploading ? 'Subiendo...' : 'Guardar Fondo'}
        </button>
      )}
    </div>
  );
};

export default ProfileBackground;
