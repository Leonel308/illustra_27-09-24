import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Trash2 } from 'lucide-react';
import '../../Styles/ProfileStyles/ProfilePortfolio.css';

const ProfilePortfolio = ({ isOwner, userId }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [portfolioImages, setPortfolioImages] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const toggleModal = () => setShowModal(!showModal);

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
            const imageRef = ref(storage, `portfolio/${userId}/${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            const downloadURL = await getDownloadURL(imageRef);

            const userDoc = doc(db, 'users', userId);
            await updateDoc(userDoc, {
                portfolio: arrayUnion({ url: downloadURL })
            });

            setUploadSuccess(true);
            setImageFile(null);
            setImagePreview(null);
            toggleModal();
            fetchPortfolioImages(); // Refrescar las imágenes después de subir la nueva
        } catch (error) {
            console.error("Error uploading image: ", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (imageURL) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta imagen?")) return;

        try {
            const imageRef = ref(storage, imageURL);
            await deleteObject(imageRef);

            const userDoc = doc(db, 'users', userId);
            await updateDoc(userDoc, {
                portfolio: arrayRemove({ url: imageURL })
            });

            fetchPortfolioImages(); // Refrescar las imágenes después de la eliminación
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const fetchPortfolioImages = useCallback(async () => {
        try {
            const userDoc = doc(db, 'users', userId);
            const docSnapshot = await getDoc(userDoc);

            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data.portfolio) {
                    const urls = data.portfolio.map(item => item.url);
                    setPortfolioImages(urls);
                }
            }
        } catch (error) {
            console.error("Error fetching portfolio images:", error);
        }
    }, [userId]);

    useEffect(() => {
        fetchPortfolioImages();
    }, [fetchPortfolioImages]);

    return (
        <div className="portfolio-uploader">
            {isOwner && (
                <button onClick={toggleModal} className="portfolio-upload-button">
                    Subir Imagen
                </button>
            )}

            {showModal && (
                <div className="portfolio-modal-overlay">
                    <div className="portfolio-modal-content">
                        <span className="portfolio-close-modal" onClick={toggleModal}>×</span>
                        <h2>Subir Imagen al Portafolio</h2>
                        <input type="file" accept="image/*" onChange={handleImageChange} />

                        {imagePreview && (
                            <div className="portfolio-image-preview">
                                <img src={imagePreview} alt="Preview de la imagen" />
                            </div>
                        )}

                        {uploading ? (
                            <p>Subiendo imagen...</p>
                        ) : (
                            <button onClick={handleUpload} disabled={!imageFile} className="portfolio-upload-button">
                                Subir Imagen
                            </button>
                        )}

                        {uploadSuccess && <p>¡Imagen subida exitosamente!</p>}
                    </div>
                </div>
            )}

            <div className="portfolio-gallery">
                <h3>Imágenes del Portafolio</h3>
                <div className="portfolio-grid">
                    {portfolioImages.length > 0 ? (
                        portfolioImages.map((imageURL, index) => (
                            <div key={index} className="portfolio-item">
                                <img src={imageURL} alt={`Portafolio ${index}`} />
                                {isOwner && (
                                    <button
                                        className="portfolio-delete-button"
                                        onClick={() => handleDeleteImage(imageURL)}
                                    >
                                        <Trash2 className="portfolio-delete-icon" />
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
