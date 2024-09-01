import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, doc, getDoc, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import PostCreator from '../HomeComponents/PostCreator';
import '../../Styles/Feed.css';

function Feed({ showNSFW }) {
  const { user } = useContext(UserContext); // Obtiene el usuario actual desde el contexto
  const navigate = useNavigate(); // Hook para navegación entre rutas
  const [posts, setPosts] = useState([]); // Estado para almacenar las publicaciones
  const [likeProcessing, setLikeProcessing] = useState({}); // Estado para manejar el procesamiento de "me gusta"

  // Función para actualizar el feed manualmente después de crear una publicación
  const updateFeed = () => {
    // Código para actualizar las publicaciones después de la creación de un post
    const postsCollection = collection(db, 'PostsCollection'); // Referencia a la colección de publicaciones SFW
    const nsfwCollection = collection(db, 'PostsCollectionMature'); // Referencia a la colección de publicaciones NSFW
    const sfwQuery = query(postsCollection, orderBy('timestamp', 'desc')); // Consulta para ordenar las publicaciones SFW por fecha de creación
    const nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc')); // Consulta para ordenar las publicaciones NSFW por fecha de creación

    // Suscripción a la colección de publicaciones SFW
    const unsubscribeSFW = onSnapshot(sfwQuery, async (snapshot) => {
      const postsList = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data(); // Obtiene los datos de cada publicación
          if (!postData || !postData.userID || !postData.description) {
            console.error('Datos de publicación inválidos', postDoc.id);
            return null;
          }
          // Obtiene la información del usuario que hizo la publicación
          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            console.error('No se encontró documento del usuario', postData.userID);
            return null;
          }
          const userData = userDoc.data();
          // Retorna un objeto con los datos de la publicación y del usuario
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

      const validPosts = postsList.filter(post => post !== null); // Filtra publicaciones válidas
      setPosts(validPosts); // Actualiza el estado con las publicaciones obtenidas
    });

    // Suscripción a la colección de publicaciones NSFW (si se selecciona ver contenido NSFW)
    const unsubscribeNSFW = onSnapshot(nsfwQuery, async (snapshot) => {
      if (showNSFW) {
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
        setPosts((prevPosts) => [...prevPosts, ...validPosts]); // Combina publicaciones SFW y NSFW
      }
    });

    return () => {
      unsubscribeSFW(); // Limpia la suscripción a las publicaciones SFW
      unsubscribeNSFW(); // Limpia la suscripción a las publicaciones NSFW
    };
  };

  // Llama a `updateFeed` cuando el componente se monte o cambie alguna dependencia
  useEffect(updateFeed, [showNSFW, user?.uid]);

  // Maneja la acción de dar "me gusta" a una publicación
  const handleLikePost = async (postId, currentLikes, isLiked) => {
    if (likeProcessing[postId]) return;

    setLikeProcessing(prev => ({ ...prev, [postId]: true })); // Marca que el proceso de "me gusta" está en curso

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
      setLikeProcessing(prev => ({ ...prev, [postId]: false })); // Marca que el proceso de "me gusta" ha terminado
    }
  };

  // Maneja la acción de eliminar una publicación
  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, 'PostsCollection', postId)); // Elimina la publicación de la base de datos
    } catch (error) {
      console.error('Error al eliminar publicación: ', error);
    }
  };

  // Navega a la vista detallada de la publicación seleccionada
  const handlePostClick = (postId) => {
    navigate(`/inspectPost/${postId}`);
  };

  // Maneja la acción de compartir la publicación
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

  // Renderiza las publicaciones en el feed
  const renderPosts = () => {
    if (posts.length === 0) {
      return <div className="feed-empty">No hay publicaciones para mostrar</div>; // Muestra mensaje si no hay publicaciones
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
      <PostCreator onPostCreated={updateFeed} /> {/* Actualiza el feed al crear una publicación */}
      {renderPosts()} {/* Renderiza las publicaciones */}
    </div>
  );
}

export default Feed;
