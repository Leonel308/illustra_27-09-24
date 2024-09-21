import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import PostCreator from '../HomeComponents/PostCreator';
import '../../Styles/Feed.css';

// Puedes eliminar las categorías si no las usas aún
// const SFW_CATEGORIES = [...];
// const NSFW_CATEGORIES = [...];

function Feed({ filters }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [likeProcessing, setLikeProcessing] = useState({});
  const [loading, setLoading] = useState(true);

  const handleSnapshot = useCallback(async (snapshot, isNSFW) => {
    const postsList = await Promise.all(
      snapshot.docs.map(async (postDoc) => {
        const postData = postDoc.data();

        if (!postData.userID || postDoc.id.includes('Template')) {
          return null;
        }

        const userDocRef = doc(db, 'users', postData.userID);
        try {
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};

          const creationDate = postData.timestamp
            ? new Date(postData.timestamp.seconds * 1000).toLocaleDateString('es-ES')
            : 'Fecha desconocida';

          return {
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Usuario Desconocido',
            userPhotoURL: userData.photoURL || '',
            isLiked: postData.likedBy?.includes(user?.uid) || false,
            isNSFW: isNSFW,
            creationDate: creationDate,
            timestamp: postData.timestamp // Mantener el timestamp para ordenar
          };
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          return null;
        }
      })
    );

    const validPosts = postsList.filter(post => post !== null);
    setPosts(prevPosts => {
      // Combinar las publicaciones nuevas con las existentes, evitando duplicados
      const combinedPosts = [
        ...prevPosts.filter(p => p.isNSFW !== isNSFW),
        ...validPosts
      ];
      // Ordenar por timestamp descendente
      combinedPosts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      return combinedPosts;
    });
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsCollection = collection(db, 'PostsCollection');
      const nsfwCollection = collection(db, 'PostsCollectionMature');

      const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
      const nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc'));

      const unsubscribeSFW = onSnapshot(postsQuery, (snapshot) => handleSnapshot(snapshot, false));
      const unsubscribeNSFW = filters.showNSFW
        ? onSnapshot(nsfwQuery, (snapshot) => handleSnapshot(snapshot, true))
        : null;

      return () => {
        unsubscribeSFW();
        if (unsubscribeNSFW) unsubscribeNSFW();
      };
    };

    fetchPosts();
  }, [filters.showNSFW, handleSnapshot]);

  const filteredPosts = posts.filter((post) => {
    // Filtrado por categorías seleccionadas
    if (filters.activeFilters.length > 0 && !filters.activeFilters.includes(post.category)) {
      return false;
    }

    // Filtrado por término de búsqueda
    const searchMatch = post.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                        post.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Filtrado por NSFW
    const nsfwMatch = filters.showNSFW || !post.isNSFW;

    return searchMatch && nsfwMatch;
  });

  const handleLikePost = async (postId, currentLikes, isLiked, isNSFW) => {
    if (likeProcessing[postId]) return;

    setLikeProcessing(prev => ({ ...prev, [postId]: true }));

    try {
      const postRef = doc(db, isNSFW ? 'PostsCollectionMature' : 'PostsCollection', postId);
      const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: isLiked
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error al actualizar likes:', error);
    } finally {
      setLikeProcessing(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId, isNSFW) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, isNSFW ? 'PostsCollectionMature' : 'PostsCollection', postId));
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error al eliminar publicación:', error);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/inspectPost/${postId}`);
  };

  const handleSharePost = async (postId) => {
    const postUrl = `${window.location.origin}/inspectPost/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "¡Mira esta publicación!",
          text: "¡Aquí hay algo interesante!",
          url: postUrl,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error al copiar texto:', error);
      }
    }
  };

  if (loading) {
    return <div className="feed-loading">Cargando...</div>;
  }

  const renderPosts = () => {
    if (filteredPosts.length === 0) {
      return <div className="feed-empty">No hay publicaciones para mostrar</div>;
    }

    return filteredPosts.map(post => (
      <div key={post.id} className="feed-post" onClick={() => handlePostClick(post.id)}>
        <div className="feed-post-header">
          <div className="feed-post-header-left">
            <img src={post.userPhotoURL} alt={post.username} className="feed-user-avatar" />
            <span className="feed-username">{post.username}</span>
          </div>
          {user?.role === 'admin' && (
            <button
              className="feed-action-button feed-delete-button"
              onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id, post.isNSFW); }}
            >
              <Trash2 className="feed-action-icon" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
        <h2 className="feed-post-title">{post.title}</h2>
        {post.imageURL && (
          <div className="feed-post-image-container">
            <img src={post.imageURL} alt={post.title} className="feed-post-image" />
          </div>
        )}
        <p className="feed-post-description">{post.description}</p>
        <p className="feed-post-category">
          Categoría: {post.category}
          {post.isNSFW && <span className="nsfw-tag">NSFW</span>}
        </p>
        <p className="feed-post-creation-date">{post.creationDate}</p>
        <div className="feed-post-actions">
          <button
            className={`feed-action-button ${post.isLiked ? 'liked' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleLikePost(post.id, post.likes, post.isLiked, post.isNSFW); }}
            disabled={likeProcessing[post.id]}
          >
            <Heart className="feed-action-icon" />
            <span>{post.likes}</span>
          </button>
          <button
            className="feed-action-button"
            onClick={(e) => { e.stopPropagation(); handlePostClick(post.id); }}
          >
            <MessageCircle className="feed-action-icon" />
            <span>Comentar</span>
          </button>
          <button
            className="feed-action-button"
            onClick={(e) => { e.stopPropagation(); handleSharePost(post.id); }}
          >
            <Share2 className="feed-action-icon" />
            <span>Compartir</span>
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="feed-container">
      <PostCreator onPostCreated={() => { /* Opcional: Puedes recargar los posts aquí */ }} />
      {renderPosts()}
    </div>
  );
}

export default Feed;
