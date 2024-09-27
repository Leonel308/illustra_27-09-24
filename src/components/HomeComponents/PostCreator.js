// src/components/PostCreator.js

import React, { useState, useContext } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import ImageCropperModal from '../Profile/ImageCropperModal';
import styles from './PostCreator.module.css'; // Importación de CSS Modules
import imageCompression from 'browser-image-compression'; // Importación de la biblioteca de compresión

function PostCreator({ onPostCreated }) {
  const { user } = useContext(UserContext);
  const [newPost, setNewPost] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isNSFW, setIsNSFW] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [postType, setPostType] = useState('quick');
  const [isPosting, setIsPosting] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'General', 'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
    'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
    'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
    'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
    'Fantasía', 'Cyberpunk', 'Retro', 'Hentai', 'Yuri', 'Yaoi', 'Gore',
    'Bondage', 'Futanari', 'Tentáculos', 'Furry NSFW',
    'Monstruos', 'Femdom', 'Maledom'
  ];

  // Reiniciar el formulario
  const resetForm = () => {
    setNewPost('');
    setTitle('');
    setDescription('');
    setCharacterCount(0);
    setImageSrc(null);
    setCroppedImage(null);
    setCategory('General');
    setIsNSFW(false);
    setErrors({});
  };

  // Validaciones del formulario
  const validateForm = () => {
    const newErrors = {};
    if (postType === 'quick' && newPost.trim() === '') {
      newErrors.newPost = 'Este campo es obligatorio.';
    }
    if (postType === 'complete') {
      if (!title.trim()) newErrors.title = 'El título es obligatorio.';
      if (!description.trim()) newErrors.description = 'La descripción es obligatoria.';
      if (!croppedImage) newErrors.image = 'La imagen es obligatoria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar la creación de una nueva publicación
  const handleNewPost = async () => {
    if (!validateForm()) return;

    setIsPosting(true);

    const collectionName = isNSFW ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const postData = {
        userID: user.uid,
        title: postType === 'complete' ? title : '',
        description: postType === 'complete' ? description : newPost,
        category,
        isNSFW,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        postType: postType,
      };

      const postRef = await addDoc(collection(db, collectionName), postData);
      const postId = postRef.id;

      // Subir imagen si es un Post Completo
      if (postType === 'complete' && croppedImage) {
        // Opcional: Comprimir la imagen antes de subirla
        const compressedFile = await imageCompression(croppedImage, {
          maxSizeMB: 1, // Tamaño máximo en MB
          maxWidthOrHeight: 800, // Máxima dimensión
          useWebWorker: true,
        });

        const imageRef = ref(storage, `posts/${user.uid}/${postId}`);
        await uploadBytes(imageRef, compressedFile);
        const imageURL = await getDownloadURL(imageRef);
        await updateDoc(postRef, { imageURL });
      }

      if (onPostCreated) {
        onPostCreated();
      }

      resetForm();
    } catch (error) {
      console.error('Error al agregar publicación:', error);
      alert('Hubo un error al publicar. Por favor, intenta nuevamente.');
    } finally {
      setIsPosting(false);
    }
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      };
    }
  };

  // Guardar imagen recortada
  const handleSaveCroppedImage = (croppedFile) => {
    setCroppedImage(croppedFile);
    setImageSrc(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  // Cancelar recorte de imagen
  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  // Cambiar tipo de post
  const handlePostTypeChange = (type) => {
    setPostType(type);
    resetForm();
  };

  return (
    <div className={styles.postCreatorContainer}>
      <div className={styles.postTypeToggle} role="group" aria-label="Tipo de publicación">
        <button
          type="button"
          className={`${styles.toggleButton} ${postType === 'quick' ? styles.active : ''}`}
          onClick={() => handlePostTypeChange('quick')}
          aria-pressed={postType === 'quick'}
        >
          Post Flash
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${postType === 'complete' ? styles.active : ''}`}
          onClick={() => handlePostTypeChange('complete')}
          aria-pressed={postType === 'complete'}
        >
          Post Completo
        </button>
      </div>

      {postType === 'quick' ? (
        <>
          <textarea
            className={`${styles.textarea} ${errors.newPost ? styles.error : ''}`}
            value={newPost}
            onChange={(e) => {
              setNewPost(e.target.value);
              setCharacterCount(e.target.value.length);
            }}
            placeholder="¿Qué está pasando?"
            maxLength={360}
            aria-label="¿Qué está pasando?"
          />
          {errors.newPost && <span className={styles.errorMessage}>{errors.newPost}</span>}
          <small className={styles.charCount}>{characterCount}/360 caracteres</small>
        </>
      ) : (
        <>
          <input
            type="text"
            className={`${styles.input} ${errors.title ? styles.error : ''}`}
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            required
            aria-label="Título de la publicación"
          />
          {errors.title && <span className={styles.errorMessage}>{errors.title}</span>}
          <textarea
            className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
            placeholder="Descripción"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setCharacterCount(e.target.value.length);
            }}
            maxLength={360}
            required
            aria-label="Descripción de la publicación"
          />
          {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
          <small className={styles.charCount}>{characterCount}/360 caracteres</small>
          <div className={styles.selectGroup}>
            <label className={styles.label} htmlFor="contentClassification">
              Clasificación de contenido:
            </label>
            <select
              id="contentClassification"
              className={`${styles.select} ${errors.isNSFW ? styles.error : ''}`}
              value={isNSFW ? 'NSFW' : 'SFW'}
              onChange={(e) => setIsNSFW(e.target.value === 'NSFW')}
              required
              aria-label="Clasificación de contenido"
            >
              <option value="SFW">SFW</option>
              <option value="NSFW">NSFW</option>
            </select>
            {errors.isNSFW && <span className={styles.errorMessage}>{errors.isNSFW}</span>}
          </div>
          <div className={styles.selectGroup}>
            <label className={styles.label} htmlFor="category">
              Categoría:
            </label>
            <select
              id="category"
              className={`${styles.select} ${errors.category ? styles.error : ''}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              aria-label="Categoría de la publicación"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className={styles.errorMessage}>{errors.category}</span>}
          </div>
          <div className={styles.fileInputContainer}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={`${styles.fileInput} ${errors.image ? styles.error : ''}`}
              aria-label="Seleccionar imagen para la publicación"
            />
            {errors.image && <span className={styles.errorMessage}>{errors.image}</span>}
          </div>
          {imageSrc && <img src={imageSrc} alt="Vista previa de la imagen" className={styles.imagePreview} />}
        </>
      )}

      <div className={styles.buttonsGroup}>
        <button
          type="button"
          onClick={handleNewPost}
          className={styles.publishButton}
          disabled={isPosting}
          aria-disabled={isPosting}
        >
          {isPosting ? <div className={styles.spinner}></div> : "Publicar"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className={styles.clearButton}
          disabled={isPosting}
          aria-disabled={isPosting}
        >
          Limpiar
        </button>
      </div>

      {showCropper && (
        <ImageCropperModal
          isOpen={showCropper}
          onClose={handleCancelCrop}
          onSave={handleSaveCroppedImage}
          imageSrc={imageSrc}
          aspect={4 / 3}
        />
      )}
    </div>
  );
}

export default PostCreator;
