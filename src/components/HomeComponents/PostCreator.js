import React, { useState, useContext } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import ImageCropperModal from '../Profile/ImageCropperModal';
import './PostCreator.css';

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

  const categories = [
    'General', 'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
    'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
    'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
    'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
    'Fantasía', 'Cyberpunk', 'Retro', 'Hentai', 'Yuri', 'Yaoi', 'Gore',
    'Bondage', 'Futanari', 'Tentáculos', 'Furry NSFW',
    'Monstruos', 'Femdom', 'Maledom'
  ];

  const resetForm = () => {
    setNewPost('');
    setTitle('');
    setDescription('');
    setCharacterCount(0);
    setImageSrc(null);
    setCroppedImage(null);
    setCategory('General');
    setIsNSFW(false);
  };

  const handleNewPost = async () => {
    if (postType === 'quick') {
      if (newPost.trim() === '') {
        alert('El campo "¿Qué está pasando?" es obligatorio.');
        return;
      }
    } else {
      if (!title.trim()) {
        alert('El campo "Título" es obligatorio.');
        return;
      }
      if (!description.trim()) {
        alert('El campo "Descripción" es obligatorio.');
        return;
      }
      if (!croppedImage) {
        alert('Por favor, selecciona y recorta una imagen.');
        return;
      }
    }

    setIsPosting(true);

    const collectionName = isNSFW ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const postRef = await addDoc(collection(db, collectionName), {
        userID: user.uid,
        title: postType === 'complete' ? title : '',
        description: postType === 'complete' ? description : newPost,
        category,
        isNSFW,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        postType: postType,
      });

      const postId = postRef.id;

      if (postType === 'complete' && croppedImage) {
        const imageRef = ref(storage, `posts/${user.uid}/${postId}`);
        await uploadBytes(imageRef, croppedImage);
        const imageURL = await getDownloadURL(imageRef);
        await updateDoc(postRef, { imageURL });
      }

      if (onPostCreated) {
        onPostCreated();
      }

      resetForm();
    } catch (error) {
      console.error('Error al agregar publicación: ', error);
    } finally {
      setIsPosting(false);
    }
  };

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

  const handleSaveCroppedImage = async (croppedFile) => {
    setCroppedImage(croppedFile);
    setImageSrc(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const handlePostTypeChange = (type) => {
    setPostType(type);
  };

  return (
    <div className="new-post-form">
      <div className="post-type-toggle">
        <button
          className={`toggle-button ${postType === 'quick' ? 'active' : ''}`}
          onClick={() => handlePostTypeChange('quick')}
        >
          Post Flash
        </button>
        <button
          className={`toggle-button ${postType === 'complete' ? 'active' : ''}`}
          onClick={() => handlePostTypeChange('complete')}
        >
          Post Completo
        </button>
      </div>

      <>
        {postType === 'quick' ? (
          <>
            <textarea
              value={newPost}
              onChange={(e) => {
                setNewPost(e.target.value);
                setCharacterCount(e.target.value.length);
              }}
              placeholder="¿Qué está pasando?"
              maxLength={360}
            />
            <small>{characterCount}/360 caracteres</small>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
            />
            <textarea
              placeholder="Descripción"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setCharacterCount(e.target.value.length);
              }}
              maxLength={360}
              required
            />
            <small>{characterCount}/360 caracteres</small>
            <label>
              Clasificación de contenido:
              <select
                value={isNSFW ? 'NSFW' : 'SFW'}
                onChange={(e) => setIsNSFW(e.target.value === 'NSFW')}
                required
              >
                <option value="SFW">SFW</option>
                <option value="NSFW">NSFW</option>
              </select>
            </label>
            <label>
              Categoría:
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imageSrc && <img src={imageSrc} alt="Preview" className="image-preview" />}
          </>
        )}
        <div className="buttons-group">
          <button onClick={handleNewPost} className="publish-button">
            {isPosting ? <div className="spinner"></div> : "Publicar"}
          </button>
          <button onClick={resetForm} className="clear-button">
            Limpiar
          </button>
        </div>
      </>
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
