import React, { useEffect, useState, useContext } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, onSnapshot, doc, getDoc, query, orderBy, addDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Send, Heart, Share2 } from 'lucide-react';
import ImageCropperModal from '../Profile/ImageCropperModal'; // Asegúrate de que la ruta sea correcta
import '../../Styles/Feed.css';

function Feed({ collectionName, searchTerm = '', activeCategory = 'Todos' }) {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('SFW');
  const [subCategory, setSubCategory] = useState('General');
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false); 
  const [characterCount, setCharacterCount] = useState(0);
  const [postType, setPostType] = useState('quick');
  const [isPosting, setIsPosting] = useState(false);
  const [likeProcessing, setLikeProcessing] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = {
    "SFW": [
      'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
      'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
      'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
      'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
      'Fantasía', 'Cyberpunk', 'Retro'
    ],
    "NSFW": [
      'Hentai', 'Yuri', 'Yaoi', 'Gore', 'Bondage',
      'Futanari', 'Tentáculos', 'Furry NSFW',
      'Monstruos', 'Femdom', 'Maledom'
    ]
  };

  useEffect(() => {
    const postsCollection = collection(db, collectionName);
    const q = query(postsCollection, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsList = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();
          if (!postData || !postData.userID || !postData.description) {
            console.error('Datos de publicación inválidos', postDoc.id);
            return null;
          }
          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            console.error('No se encontró documento del usuario', postData.userID);
            return null;
          }
          const userData = userDoc.data();
          return {
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Usuario Desconocido',
            userPhotoURL: userData.photoURL || '',
            commentsOpen: false,
            isLiked: postData.likedBy?.includes(user?.uid) || false,
          };
        })
      );

      const validPosts = postsList.filter(post => post !== null);

      const filteredPosts = validPosts.filter(post => {
        const matchesSearch = post.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || post.category.toLowerCase().includes(activeCategory.toLowerCase());
        return matchesSearch && matchesCategory;
      });

      setPosts(filteredPosts);
    });

    return () => unsubscribe();
  }, [collectionName, searchTerm, activeCategory, user?.uid]);

  const handleAddComment = async (postId, commentText) => {
    if (commentText.trim() === '') return;

    try {
      const comment = {
        comment: commentText,
        timestamp: new Date(),
        user: user.username,
        userPhotoURL: user.photoURL || '',
      };
      const commentsCollectionRef = collection(db, `${collectionName}/${postId}/comments`);
      await addDoc(commentsCollectionRef, comment);
      setNewComment('');
    } catch (error) {
      console.error('Error al agregar comentario: ', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, collectionName, postId));
    } catch (error) {
      console.error('Error al eliminar publicación: ', error);
    }
  };

  const handleNewPost = async () => {
    if (newPost.trim() === '' || (isExpanded && (!title || !description || !croppedImage))) {
      return; // Elimina el setError aquí ya que no estamos manejando errores directamente
    }

    setIsPosting(true);

    const isAdultContent = mainCategory === 'NSFW';
    const collectionName = isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const postRef = await addDoc(collection(db, collectionName), {
        userID: user.uid,
        title: isExpanded ? title : newPost.substring(0, 60),
        description: isExpanded ? description : newPost,
        category: `${mainCategory} - ${subCategory}`,
        isAdultContent,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
      });

      const postId = postRef.id;

      if (croppedImage) {
        const imageRef = ref(storage, `posts/${user.uid}/${postId}`);
        await uploadBytes(imageRef, croppedImage);
        const imageURL = await getDownloadURL(imageRef);
        await updateDoc(postRef, { imageURL });
      }

      setNewPost('');
      setTitle('');
      setDescription('');
      setCharacterCount(0);
      setIsExpanded(false);
      setImageSrc(null);
      setCroppedImage(null);
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
    setShowCropper(false); 
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null); 
  };

  const handleLikePost = async (postId, currentLikes, isLiked) => {
    if (likeProcessing[postId]) return;

    setLikeProcessing(prev => ({ ...prev, [postId]: true }));

    try {
      const postRef = doc(db, collectionName, postId);
      const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: isLiked
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error al actualizar likes: ', error);
    } finally {
      setLikeProcessing(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          commentsOpen: !post.commentsOpen,
        };
      }
      return post;
    }));
  };

  const handleSharePost = (postId) => {
    const postUrl = `${window.location.origin}/inspectPost/${postId}`;
    if (navigator.share) {
      navigator.share({
        title: "¡Mira esta publicación!",
        text: "¡Aquí hay algo interesante!",
        url: postUrl,
      }).catch((error) => console.error('Error al compartir', error));
    } else {
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Enlace copiado al portapapeles');
      }, (error) => {
        console.error('Error al copiar texto', error);
      });
    }
  };

  const handleClearPostData = () => {
    setNewPost('');
    setTitle('');
    setDescription('');
    setCharacterCount(0);
    setIsExpanded(false);
    setImageSrc(null);
    setCroppedImage(null);
  };

  const renderPosts = () => {
    if (posts.length === 0) {
      return <div className="feed-empty">No hay publicaciones para mostrar</div>;
    }

    return posts.map(post => (
      <div key={post.id} className="feed-post">
        <div className="feed-post-header">
          <img src={post.userPhotoURL} alt={post.username} className="feed-user-avatar" />
          <span className="feed-username">{post.username}</span>
        </div>
        {post.imageURL && (
          <img
            src={post.imageURL}
            alt={post.description}
            className="feed-post-image"
            onClick={() => window.open(post.imageURL, '_blank')}
            style={{ cursor: 'pointer' }}
          />
        )}
        <div className="feed-post-content">
          <p className="feed-post-description">{post.description}</p>
          <p className="feed-post-category">Categoría: {post.category}</p>
          <div className="feed-post-actions">
            <button
              className={`action-button ${post.isLiked ? 'liked' : ''}`}
              onClick={() => handleLikePost(post.id, post.likes, post.isLiked)}
              disabled={likeProcessing[post.id]}
            >
              <Heart className="action-icon" />
              <span>{post.likes}</span>
            </button>
            <button className="action-button" onClick={() => handleToggleComments(post.id)}>
              <MessageCircle className="action-icon" />
              <span>Comentar</span>
            </button>
            <button className="action-button" onClick={() => handleSharePost(post.id)}>
              <Share2 className="action-icon" />
              <span>Compartir</span>
            </button>
            {user?.role === 'admin' && (
              <button
                className="action-button delete-button"
                onClick={() => handleDeletePost(post.id)}
              >
                <Trash2 className="action-icon" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
          <div className={`feed-comments ${post.commentsOpen ? 'open' : ''}`}>
            {post.comments?.map((comment, index) => (
              <div key={index} className="feed-comment">
                <img src={comment.userPhotoURL} alt={comment.user} className="comment-user-avatar" />
                <div className="comment-content">
                  <strong>{comment.user}:</strong> {comment.comment}
                </div>
              </div>
            ))}
          </div>
          {post.commentsOpen && user && (
            <div className="feed-comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añade un comentario..."
              />
              <button
                onClick={() => handleAddComment(post.id, newComment)}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="feed-container">
      <div className="new-post-form">
        <div className="post-type-toggle">
          <button
            className={`toggle-button ${postType === 'quick' ? 'active' : ''}`}
            onClick={() => setPostType('quick')}
          >
            Post Flash
          </button>
          <button
            className={`toggle-button ${postType === 'complete' ? 'active' : ''}`}
            onClick={() => setPostType('complete')}
          >
            Post Completo
          </button>
        </div>
        
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
            <button onClick={handleNewPost} className="publish-button">
              {isPosting ? <div className="spinner"></div> : "Publicar"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
            <div className="buttons-group">
              <button onClick={handleNewPost} className="publish-button">
                {isPosting ? <div className="spinner"></div> : "Publicar"}
              </button>
              <button onClick={handleClearPostData} className="clear-button">
                Limpiar
              </button>
            </div>
          </>
        )}
      </div>
      {renderPosts()}
      {showCropper && (
        <ImageCropperModal
          isOpen={showCropper}
          onClose={handleCancelCrop}
          onSave={handleSaveCroppedImage}
          imageSrc={imageSrc}
          aspect={4 / 3} // Ajusta el aspecto según lo que necesites
        />
      )}
    </div>
  );
}

export default Feed;
