import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import UserContext from '../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import '../Styles/ExplorePosts.css';

function ExplorePosts() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [nsfwPosts, setNSFWPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [likeProcessing, setLikeProcessing] = useState({});
  const [showNSFW, setShowNSFW] = useState(false);

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

          const creationDate = postData.timestamp ? format(postData.timestamp.toDate(), 'dd/MM/yyyy') : 'Fecha desconocida';

          return {
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Usuario desconocido',
            userPhotoURL: userData.photoURL || '',
            isLiked: postData.likedBy?.includes(user?.uid) || false,
            isNSFW: isNSFW,
            creationDate: creationDate
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validPosts = postsList.filter(post => post !== null);

    if (isNSFW) {
      setNSFWPosts(validPosts);
    } else {
      setPosts(validPosts);
    }

    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsCollection = collection(db, 'PostsCollection');
      const nsfwCollection = collection(db, 'PostsCollectionMature');
      const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
      const nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc'));

      const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => handleSnapshot(snapshot, false));
      const unsubscribeNSFW = showNSFW ? onSnapshot(nsfwQuery, (snapshot) => handleSnapshot(snapshot, true)) : null;

      return () => {
        unsubscribePosts();
        if (unsubscribeNSFW) unsubscribeNSFW();
      };
    };

    fetchPosts();
  }, [showNSFW, handleSnapshot]);

  const filteredPosts = [...posts, ...nsfwPosts].filter((post) => {
    const categoryMatch = selectedCategory === '' || post.category === selectedCategory;
    const searchMatch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const nsfwMatch = showNSFW || !post.isNSFW;
    return categoryMatch && searchMatch && nsfwMatch;
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
      console.error('Error al actualizar likes: ', error);
    } finally {
      setLikeProcessing(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId, isNSFW) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, isNSFW ? 'PostsCollectionMature' : 'PostsCollection', postId));
    } catch (error) {
      console.error('Error al eliminar publicación: ', error);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/inspectPost/${postId}`);
  };

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

  if (loading) {
    return <div className="explore-posts-loading">Cargando...</div>;
  }

  return (
    <div className="explore-posts-container">
      <div className="explore-posts-filters">
        <select
          className="explore-posts-category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="Arte Conceptual">Arte Conceptual</option>
          <option value="Fan Art">Fan Art</option>
          <option value="Anime">Anime</option>
        </select>
        <input
          type="text"
          className="explore-posts-search-filter"
          placeholder="Buscar publicaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="nsfw-switch">
          <span>NSFW</span>
          <input
            type="checkbox"
            checked={showNSFW}
            onChange={() => setShowNSFW(!showNSFW)}
          />
        </div>
      </div>
      <div className="explore-posts-grid">
        {filteredPosts.map(post => (
          <div key={post.id} className="explore-post" onClick={() => handlePostClick(post.id)}>
            <div className="explore-post-header">
              <div className="explore-post-header-left">
                <img src={post.userPhotoURL} alt={post.username} className="explore-user-avatar" />
                <span className="explore-username">{post.username}</span>
              </div>
              {user?.role === 'admin' && (
                <button
                  className="explore-action-button explore-delete-button"
                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id, post.isNSFW); }}
                >
                  <Trash2 className="explore-action-icon" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
            <h2 className="explore-post-title">{post.title}</h2>
            {post.imageURL && (
              <div className="explore-post-image-container">
                <img src={post.imageURL} alt={post.title} className="explore-post-image" />
              </div>
            )}
            <p className="explore-post-description">{post.description}</p>
            <p className="explore-post-category">
              Categoría: {post.category}
              {post.isNSFW && <span className="nsfw-tag">NSFW</span>}
            </p>
            <p className="explore-post-creation-date">{post.creationDate}</p>
            <div className="explore-post-actions">
              <button
                className={`explore-action-button ${post.isLiked ? 'liked' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleLikePost(post.id, post.likes, post.isLiked, post.isNSFW); }}
                disabled={likeProcessing[post.id]}
              >
                <Heart className="explore-action-icon" />
                <span>{post.likes}</span>
              </button>
              <button
                className="explore-action-button"
                onClick={(e) => { e.stopPropagation(); handlePostClick(post.id); }}
              >
                <MessageCircle className="explore-action-icon" data-icon="message-circle" />
                <span>Comentar</span>
              </button>
              <button
                className="explore-action-button"
                onClick={(e) => { e.stopPropagation(); handleSharePost(post.id); }}
              >
                <Share2 className="explore-action-icon" data-icon="share" />
                <span>Compartir</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExplorePosts;