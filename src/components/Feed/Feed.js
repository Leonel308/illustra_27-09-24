// Feed.js

import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
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
  deleteDoc,
} from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import PostCreator from '../HomeComponents/PostCreator';
import styles from '../../Styles/Feed.module.css'; // Importación de CSS Modules

function Feed({ filters }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [likeProcessing, setLikeProcessing] = useState({});
  const [loading, setLoading] = useState(true);

  const handleSnapshot = useCallback(
    async (snapshot, isNSFW) => {
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
              userPhotoURL: userData.photoURL || '/user-placeholder.png',
              isLiked: postData.likedBy?.includes(user?.uid) || false,
              isNSFW: isNSFW,
              creationDate: creationDate,
              timestamp: postData.timestamp, // Mantener el timestamp para ordenar
            };
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            return null;
          }
        })
      );

      const validPosts = postsList.filter((post) => post !== null);
      setPosts((prevPosts) => {
        // Combinar las publicaciones nuevas con las existentes, evitando duplicados
        const combinedPosts = [
          ...prevPosts.filter((p) => p.isNSFW !== isNSFW),
          ...validPosts,
        ];
        // Ordenar por timestamp descendente
        combinedPosts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
        return combinedPosts;
      });
      setLoading(false);
    },
    [user?.uid]
  );

  useEffect(() => {
    const postsCollection = collection(db, 'PostsCollection');
    const nsfwCollection = collection(db, 'PostsCollectionMature');

    const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    const nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc'));

    const unsubscribeSFW = onSnapshot(postsQuery, (snapshot) =>
      handleSnapshot(snapshot, false)
    );
    const unsubscribeNSFW = filters.showNSFW
      ? onSnapshot(nsfwQuery, (snapshot) => handleSnapshot(snapshot, true))
      : null;

    return () => {
      unsubscribeSFW();
      if (unsubscribeNSFW) unsubscribeNSFW();
    };
  }, [filters.showNSFW, handleSnapshot]);

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        // Filtrado por categorías seleccionadas
        if (filters.activeFilters.length > 0 && !filters.activeFilters.includes(post.category)) {
          return false;
        }

        // Filtrado por término de búsqueda
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchMatch =
          post.title.toLowerCase().includes(searchTerm) ||
          post.description.toLowerCase().includes(searchTerm);

        // Filtrado por NSFW
        const nsfwMatch = filters.showNSFW || !post.isNSFW;

        return searchMatch && nsfwMatch;
      }),
    [posts, filters]
  );

  const handleLikePost = async (postId, currentLikes, isLiked, isNSFW) => {
    if (!user?.uid) {
      console.error('Usuario no autenticado');
      return;
    }
    if (likeProcessing[postId]) return;

    setLikeProcessing((prev) => ({ ...prev, [postId]: true }));

    try {
      const postRef = doc(db, isNSFW ? 'PostsCollectionMature' : 'PostsCollection', postId);
      const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error) {
      console.error('Error al actualizar likes:', error);
    } finally {
      setLikeProcessing((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId, isNSFW) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;

    try {
      await deleteDoc(doc(db, isNSFW ? 'PostsCollectionMature' : 'PostsCollection', postId));
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
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
          title: '¡Mira esta publicación!',
          text: '¡Aquí hay algo interesante!',
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
    return <div className={styles.feedLoading}>Cargando...</div>;
  }

  const renderPosts = () => {
    if (filteredPosts.length === 0) {
      return <div className={styles.feedEmpty}>No hay publicaciones para mostrar</div>;
    }

    return filteredPosts.map((post) => (
      <div key={post.id} className={styles.feedPost}>
        <div className={styles.feedPostHeader}>
          <div
            className={styles.feedPostHeaderLeft}
            onClick={() => navigate(`/profile/${post.userID}`)}
          >
            <img
              src={post.userPhotoURL || '/user-placeholder.png'}
              alt={post.username}
              className={styles.feedUserAvatar}
            />
            <span className={styles.feedUsername}>{post.username}</span>
          </div>
          {user?.role === 'admin' && (
            <button
              className={styles.feedDeleteButton}
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePost(post.id, post.isNSFW);
              }}
            >
              <Trash2 className={styles.feedActionIcon} />
              <span>Eliminar</span>
            </button>
          )}
        </div>
        <div className={styles.feedPostContent}>
          <h2 className={styles.feedPostTitle} onClick={() => handlePostClick(post.id)}>
            {post.title}
          </h2>
          {post.imageURL && (
            <div
              className={styles.feedPostImageContainer}
              onClick={() => handlePostClick(post.id)}
            >
              <img src={post.imageURL} alt={post.title} className={styles.feedPostImage} />
            </div>
          )}
          <p className={styles.feedPostDescription}>{post.description}</p>
          <p className={styles.feedPostCategory}>
            Categoría: {post.category}
            {post.isNSFW && <span className={styles.nsfwTag}>NSFW</span>}
          </p>
          <p className={styles.feedPostCreationDate}>{post.creationDate}</p>
        </div>
        <div className={styles.feedPostActions}>
          <button
            className={`${styles.feedActionButton} ${post.isLiked ? styles.liked : ''}`}
            onClick={() => handleLikePost(post.id, post.likes, post.isLiked, post.isNSFW)}
            disabled={likeProcessing[post.id]}
          >
            <Heart className={styles.feedActionIcon} />
            <span>{post.likes}</span>
          </button>
          <button
            className={styles.feedActionButton}
            onClick={() => handlePostClick(post.id)}
          >
            <MessageCircle className={styles.feedActionIcon} />
            <span>Comentar</span>
          </button>
          <button
            className={styles.feedActionButton}
            onClick={() => handleSharePost(post.id)}
          >
            <Share2 className={styles.feedActionIcon} />
            <span>Compartir</span>
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.feedContainer}>
      <PostCreator />
      {renderPosts()}
    </div>
  );
}

export default Feed;
