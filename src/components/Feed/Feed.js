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
import styles from '../../Styles/Feed.module.css';

export default function Feed({ filters }) {
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
          if (!postData.userID || postDoc.id.includes('Template')) return null;
          
          try {
            const userDoc = await getDoc(doc(db, 'users', postData.userID));
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
              isNSFW,
              creationDate,
              timestamp: postData.timestamp,
            };
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            return null;
          }
        })
      );

      const validPosts = postsList.filter(Boolean);
      setPosts((prevPosts) => {
        const combinedPosts = [...prevPosts.filter((p) => p.isNSFW !== isNSFW), ...validPosts];
        return combinedPosts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      });
      setLoading(false);
    },
    [user?.uid]
  );

  useEffect(() => {
    const postsQuery = query(collection(db, 'PostsCollection'), orderBy('timestamp', 'desc'));
    const unsubscribeSFW = onSnapshot(postsQuery, (snapshot) => handleSnapshot(snapshot, false));

    let unsubscribeNSFW = null;
    if (filters.showNSFW) {
      const nsfwQuery = query(collection(db, 'PostsCollectionMature'), orderBy('timestamp', 'desc'));
      unsubscribeNSFW = onSnapshot(nsfwQuery, (snapshot) => handleSnapshot(snapshot, true));
    }

    return () => {
      unsubscribeSFW();
      if (unsubscribeNSFW) unsubscribeNSFW();
    };
  }, [filters.showNSFW, handleSnapshot]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filters.activeFilter && post.category !== filters.activeFilter) return false;
      const searchTerm = filters.searchTerm.toLowerCase();
      const searchMatch =
        post.title.toLowerCase().includes(searchTerm) ||
        post.description.toLowerCase().includes(searchTerm);
      return searchMatch && (filters.showNSFW || !post.isNSFW);
    });
  }, [posts, filters]);

  const handleLikePost = async (postId, currentLikes, isLiked, isNSFW) => {
    if (!user?.uid || likeProcessing[postId]) return;
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

  const handlePostClick = (postId) => navigate(`/inspectPost/${postId}`);

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

  return (
    <div className={styles.feedContainer}>
      <PostCreator />
      {filteredPosts.length === 0 ? (
        <div className={styles.feedEmpty}>No hay publicaciones para mostrar</div>
      ) : (
        filteredPosts.map((post) => (
          <div key={post.id} className={styles.feedPost}>
            {user?.role === 'admin' && (
              <button
                className={styles.feedDeleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost(post.id, post.isNSFW);
                }}
                title="Eliminar Publicación"
                aria-label="Eliminar Publicación"
              >
                <Trash2 size={16} />
              </button>
            )}
            <div className={styles.feedPostHeader}>
              <div className={styles.feedPostHeaderLeft}>
                <img
                  src={post.userPhotoURL}
                  alt={post.username}
                  className={styles.feedUserAvatar}
                />
                <span
                  className={styles.feedUsername}
                  onClick={() => navigate(`/profile/${post.userID}`)}
                >
                  {post.username}
                </span>
              </div>
            </div>
            <div className={styles.feedPostContent}>
              <h2 className={styles.feedPostTitle}>{post.title}</h2>
              {post.imageURL && (
                <div className={styles.feedPostImageContainer}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikePost(post.id, post.likes, post.isLiked, post.isNSFW);
                }}
                disabled={likeProcessing[post.id]}
                aria-label={post.isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
              >
                <Heart className={styles.feedActionIcon} />
                <span>{post.likes}</span>
              </button>
              <button
                className={styles.feedActionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostClick(post.id);
                }}
                aria-label="Comentar"
              >
                <MessageCircle className={styles.feedActionIcon} />
                <span>Comentar</span>
              </button>
              <button
                className={styles.feedActionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSharePost(post.id);
                }}
                aria-label="Compartir"
              >
                <Share2 className={styles.feedActionIcon} />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}