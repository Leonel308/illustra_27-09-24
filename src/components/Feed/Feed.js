import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, doc, getDoc, query, where, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import PostCreator from '../HomeComponents/PostCreator';
import '../../Styles/Feed.css';

function Feed({ showNSFW, userId }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [likeProcessing, setLikeProcessing] = useState({});

  // Función para obtener los posts
  const updateFeed = () => {
    const postsCollection = collection(db, 'PostsCollection');
    const nsfwCollection = collection(db, 'PostsCollectionMature');

    // Consultas por SFW y NSFW posts
    let sfwQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    let nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc'));

    // Si se proporciona userId, filtramos solo las publicaciones de ese usuario
    if (userId) {
      sfwQuery = query(postsCollection, where('userID', '==', userId), orderBy('timestamp', 'desc'));
      nsfwQuery = query(nsfwCollection, where('userID', '==', userId), orderBy('timestamp', 'desc'));
    }

    // Ejecuta la consulta SFW y añade publicaciones NSFW si se habilita la opción
    const unsubscribeSFW = onSnapshot(sfwQuery, async (snapshot) => {
      console.log('SFW Snapshot size: ', snapshot.size); // Depuración

      const postsList = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();

          // Verificar campos esenciales para evitar errores
          if (!postData || !postData.userID || !postData.description) {
            console.error('Datos de publicación inválidos', postDoc.id);
            return null;
          }

          // Obtener datos del usuario
          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            console.error('No se encontró el documento del usuario', postData.userID);
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

      // Filtramos publicaciones válidas
      const validPosts = postsList.filter(post => post !== null);
      console.log('SFW Valid Posts: ', validPosts); // Depuración
      setPosts(validPosts);
    });

    // Solo añadimos las publicaciones NSFW si showNSFW está activo
    const unsubscribeNSFW = onSnapshot(nsfwQuery, async (snapshot) => {
      if (showNSFW) {
        console.log('NSFW Snapshot size: ', snapshot.size); // Depuración

        const postsList = await Promise.all(
          snapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();

            // Verificar campos esenciales para evitar errores
            if (!postData || !postData.userID || !postData.description) {
              console.error('Datos de publicación inválidos', postDoc.id);
              return null;
            }

            // Obtener datos del usuario
            const userDocRef = doc(db, 'users', postData.userID);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
              console.error('No se encontró el documento del usuario', postData.userID);
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

        // Filtramos publicaciones válidas y añadimos a las publicaciones SFW
        const validPosts = postsList.filter(post => post !== null);
        console.log('NSFW Valid Posts: ', validPosts); // Depuración
        setPosts(prevPosts => [...prevPosts, ...validPosts]);
      }
    });

    return () => {
      unsubscribeSFW();
      unsubscribeNSFW();
    };
  };

  useEffect(updateFeed, [showNSFW, userId, user?.uid]);

  // Función para dar like a una publicación
  const handleLikePost = async (postId, currentLikes, isLiked) => {
    if (likeProcessing[postId]) return;

    setLikeProcessing(prev => ({ ...prev, [postId]: true }));

    try {
      const postRef = doc(db, 'PostsCollection', postId);
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

  // Función para eliminar una publicación
  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, 'PostsCollection', postId));
    } catch (error) {
      console.error('Error al eliminar publicación: ', error);
    }
  };

  // Función para manejar clic en una publicación
  const handlePostClick = (postId) => {
    navigate(`/inspectPost/${postId}`);
  };

  // Función para compartir una publicación
  const handleSharePost = async (postId) => {
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

  // Renderización de las publicaciones
  const renderPosts = () => {
    if (posts.length === 0) {
      return <div className="feed-empty">No hay publicaciones para mostrar</div>;
    }

    return posts.map(post => (
      <div key={post.id} className="feed-post" onClick={() => handlePostClick(post.id)}>
        <div className="feed-post-header">
          <img src={post.userPhotoURL} alt={post.username} className="feed-user-avatar" />
          <span className="feed-username">{post.username}</span>
        </div>
        <h2 className="feed-post-title">{post.title}</h2>
        {post.imageURL && (
          <div className="feed-post-image-container">
            <img
              src={post.imageURL}
              alt={post.description}
              className="feed-post-image"
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
        <div className="feed-post-content">
          <p className="feed-post-description">{post.description}</p>
          <p className="feed-post-category">Categoría: {post.category}</p>
          <div className="feed-post-actions">
            <button
              className={`action-button ${post.isLiked ? 'liked' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleLikePost(post.id, post.likes, post.isLiked); }}
              disabled={likeProcessing[post.id]}
            >
              <Heart className="action-icon" />
              <span>{post.likes}</span>
            </button>
            <button
              className="action-button"
              onClick={(e) => { e.stopPropagation(); handlePostClick(post.id); }}
            >
              <MessageCircle className="action-icon" />
              <span>Comentar</span>
            </button>
            <button
              className="action-button"
              onClick={(e) => { e.stopPropagation(); handleSharePost(post.id); }}
            >
              <Share2 className="action-icon" />
              <span>Compartir</span>
            </button>
            {user?.role === 'admin' && (
              <button
                className="action-button delete-button"
                onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
              >
                <Trash2 className="action-icon" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="feed-container">
      <PostCreator onPostCreated={updateFeed} />
      {renderPosts()}
    </div>
  );
}

export default Feed;
