import React, { useState, useContext } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import ImageCropperModal from '../Profile/ImageCropperModal';
import './PostCreator.css';

function PostCreator({ onPostCreated }) {
  const { user } = useContext(UserContext); // Obtenemos el usuario actual desde el contexto
  const [newPost, setNewPost] = useState(''); // Estado para el contenido de un post rápido
  const [title, setTitle] = useState(''); // Estado para el título de un post completo
  const [description, setDescription] = useState(''); // Estado para la descripción de un post completo
  const [mainCategory, setMainCategory] = useState('SFW'); // Estado para la categoría principal (SFW/NSFW)
  const [subCategory, setSubCategory] = useState('General'); // Estado para la subcategoría
  const [imageSrc, setImageSrc] = useState(null); // Estado para la imagen original seleccionada
  const [croppedImage, setCroppedImage] = useState(null); // Estado para la imagen recortada
  const [showCropper, setShowCropper] = useState(false); // Estado para mostrar u ocultar el cropper de imagen
  const [characterCount, setCharacterCount] = useState(0); // Estado para el contador de caracteres
  const [postType, setPostType] = useState('quick'); // Estado para el tipo de post (rápido/completo)
  const [isPosting, setIsPosting] = useState(false); // Estado para mostrar el spinner de carga

  const categories = {
    "SFW": [
      'General', 'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
      'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
      'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
      'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
      'Fantasía', 'Cyberpunk', 'Retro'
    ],
    "NSFW": [
      'General', 'Hentai', 'Yuri', 'Yaoi', 'Gore', 'Bondage',
      'Futanari', 'Tentáculos', 'Furry NSFW',
      'Monstruos', 'Femdom', 'Maledom'
    ]
  };

  const resetForm = () => {
    setNewPost('');
    setTitle('');
    setDescription('');
    setCharacterCount(0);
    setImageSrc(null);
    setCroppedImage(null);
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

    setIsPosting(true); // Muestra el spinner de carga

    const isAdultContent = mainCategory === 'NSFW';
    const collectionName = isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const postRef = await addDoc(collection(db, collectionName), {
        userID: user.uid,
        title: postType === 'complete' ? title : '',
        description: postType === 'complete' ? description : newPost,
        category: `${mainCategory} - ${subCategory}`,
        isAdultContent,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        postType: postType,
      });

      const postId = postRef.id;

      // Subir imagen solo si es un post completo
      if (postType === 'complete' && croppedImage) {
        const imageRef = ref(storage, `posts/${user.uid}/${postId}`);
        await uploadBytes(imageRef, croppedImage);
        const imageURL = await getDownloadURL(imageRef);
        await updateDoc(postRef, { imageURL });
      }

      // Refrescar feed después de publicar
      if (onPostCreated) {
        onPostCreated();
      }

      // Limpiar campos después de la publicación
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
            <select
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              required
            >
              <option value="SFW">SFW</option>
              <option value="NSFW">NSFW</option>
            </select>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              required
            >
              {categories[mainCategory].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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
