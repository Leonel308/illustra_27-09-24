import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebaseConfig';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { Trash2 } from 'lucide-react';
import styles from '../../Styles/ProfileStyles/ProfilePortfolio.module.css';

const ProfilePortfolio = ({ isOwner, userId }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => {
    setShowModal(!showModal);
    // Reiniciar estados al cerrar el modal
    if (showModal) {
      setImageFile(null);
      setImagePreview(null);
      setUploadSuccess(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setUploading(true);

    try {
      const uniqueImageName = `${Date.now()}_${imageFile.name}`;
      const imageRef = ref(storage, `portfolio/${userId}/${uniqueImageName}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        portfolio: arrayUnion({
          url: downloadURL,
          storagePath: imageRef.fullPath,
        }),
      });

      setUploadSuccess(true);
      setImageFile(null);
      setImagePreview(null);
      toggleModal();
      fetchPortfolioImages(); // Refrescar las imágenes después de subir la nueva
    } catch (error) {
      console.error('Error uploading image: ', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image) => {
    if (
      !window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')
    )
      return;

    try {
      // Obtener la referencia del archivo en Firebase Storage
      const imageRef = ref(storage, image.storagePath);

      // Eliminar el archivo de Firebase Storage
      await deleteObject(imageRef);

      // Actualizar el documento del usuario en Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        portfolio: arrayRemove(image),
      });

      fetchPortfolioImages(); // Refrescar las imágenes después de la eliminación
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const fetchPortfolioImages = useCallback(async () => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.portfolio) {
          setPortfolioImages(data.portfolio);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio images:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchPortfolioImages();
  }, [fetchPortfolioImages]);

  return (
    <div className={styles.portfolioUploader}>
      {isOwner && (
        <button
          onClick={toggleModal}
          className={styles.portfolioUploadButton}
        >
          Subir Imagen
        </button>
      )}

      {showModal && (
        <div className={styles.portfolioModalOverlay}>
          <div className={styles.portfolioModalContent}>
            <span
              className={styles.portfolioCloseModal}
              onClick={toggleModal}
            >
              ×
            </span>
            <h2>Subir Imagen al Portafolio</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {imagePreview && (
              <div className={styles.portfolioImagePreview}>
                <img src={imagePreview} alt="Preview de la imagen" />
              </div>
            )}

            {uploading ? (
              <p>Subiendo imagen...</p>
            ) : (
              <button
                onClick={handleUpload}
                disabled={!imageFile}
                className={styles.portfolioUploadButton}
              >
                Subir Imagen
              </button>
            )}

            {uploadSuccess && <p>¡Imagen subida exitosamente!</p>}
          </div>
        </div>
      )}

      <div className={styles.portfolioGallery}>
        <h3>Imágenes del Portafolio</h3>
        <div className={styles.portfolioGrid}>
          {portfolioImages.length > 0 ? (
            portfolioImages.map((image, index) => (
              <div key={index} className={styles.portfolioItem}>
                <img src={image.url} alt={`Portafolio ${index}`} />
                {isOwner && (
                  <button
                    className={styles.portfolioDeleteButton}
                    onClick={() => handleDeleteImage(image)}
                  >
                    <Trash2 className={styles.portfolioDeleteIcon} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No hay imágenes en tu portafolio.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePortfolio;
