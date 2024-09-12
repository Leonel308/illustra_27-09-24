import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, doc, getDoc, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import PostCreator from '../HomeComponents/PostCreator';
import '../../Styles/Feed.css';

function Feed({ showNSFW }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [likeProcessing, setLikeProcessing] = useState({});

  const updateFeed = () => {
    const postsCollection = collection(db, 'PostsCollection');
    const nsfwCollection = collection(db, 'PostsCollectionMature');

    let sfwQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    let nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc'));

    const unsubscribeSFW = onSnapshot(sfwQuery, async (snapshot) => {
      const postsList = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();

          if (!postData || !postData.userID || !postData.description) {
            return null;
          }

          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            return null;
          }

          const userData = userDoc.data();
          return {
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Usuario Desconocido',
            userPhotoURL: userData.photoURL || '',
            isLiked: postData.likedBy?.includes(user?.uid) || false,
            isNSFW: false,
          };
        })
      );

      const validPosts = postsList.filter(post => post !== null);
      setPosts(validPosts);
    });

    const unsubscribeNSFW = showNSFW ? onSnapshot(nsfwQuery, async (snapshot) => {
      const postsList = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();

          if (!postData || !postData.userID || !postData.description) {
            return null;
          }

          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            return null;
          }

          const userData = userDoc.data();
          return {
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Usuario Desconocido',
            userPhotoURL: userData.photoURL || '',
            isLiked: postData.likedBy?.includes(user?.uid) || false,
            isNSFW: true,
          };
        })
      );

      const validPosts = postsList.filter(post => post !== null);
      setPosts(prevPosts => [...prevPosts, ...validPosts].sort((a, b) => b.timestamp - a.timestamp));
    }) : null;

    return () => {
      unsubscribeSFW();
      if (unsubscribeNSFW) unsubscribeNSFW();
    };
  };

  useEffect(updateFeed, [showNSFW, user?.uid]);

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
      console.error('Error updating likes:', error);
    } finally {
      setLikeProcessing(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId, isNSFW) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, isNSFW ? 'PostsCollectionMature' : 'PostsCollection', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
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
        console.error('Error sharing post:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error copying post URL:', error);
      }
    }
  };

  const renderPosts = () => {
    if (posts.length === 0) {
      return <div className="feed-empty">No hay publicaciones para mostrar</div>;
    }

    return posts.map(post => (
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
      <PostCreator onPostCreated={updateFeed} />
      {renderPosts()}
    </div>
  );
}

export default Feed;