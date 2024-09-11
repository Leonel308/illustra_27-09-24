import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, doc, getDoc, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { MessageCircle, Trash2, Heart, Share2 } from 'lucide-react';
import PostCreator from '../HomeComponents/PostCreator';
import '../../Styles/Feed.css';

function Feed({ showNSFW }) {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [likeProcessing, setLikeProcessing] = useState({});

  // Function to fetch posts
  const updateFeed = () => {
    const postsCollection = collection(db, 'PostsCollection');
    const nsfwCollection = collection(db, 'PostsCollectionMature');

    // Queries for SFW and NSFW posts
    let sfwQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    let nsfwQuery = query(nsfwCollection, orderBy('timestamp', 'desc'));

    // Execute the SFW query and add NSFW posts if the option is enabled
    const unsubscribeSFW = onSnapshot(sfwQuery, async (snapshot) => {
      const postsList = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();

          // Validate essential fields to avoid errors
          if (!postData || !postData.userID || !postData.description) {
            return null;
          }

          // Get user data
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
            commentsOpen: false,
            isLiked: postData.likedBy?.includes(user?.uid) || false,
          };
        })
      );

      // Filter valid posts and set them in the state
      const validPosts = postsList.filter(post => post !== null);
      setPosts(validPosts);
    });

    // Only fetch NSFW posts if showNSFW is true
    const unsubscribeNSFW = onSnapshot(nsfwQuery, async (snapshot) => {
      if (showNSFW) {
        const postsList = await Promise.all(
          snapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();

            // Validate essential fields to avoid errors
            if (!postData || !postData.userID || !postData.description) {
              return null;
            }

            // Get user data
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
              commentsOpen: false,
              isLiked: postData.likedBy?.includes(user?.uid) || false,
            };
          })
        );

        // Filter valid posts and append to the existing SFW posts
        const validPosts = postsList.filter(post => post !== null);
        setPosts(prevPosts => [...prevPosts, ...validPosts]);
      }
    });

    return () => {
      unsubscribeSFW();
      unsubscribeNSFW();
    };
  };

  useEffect(updateFeed, [showNSFW, user?.uid]);

  // Function to like a post
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
      console.error('Error updating likes:', error);
    } finally {
      setLikeProcessing(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Function to delete a post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, 'PostsCollection', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Function to handle click on a post
  const handlePostClick = (postId) => {
    // Implement navigation logic here if needed
    console.log("Clicked post with ID:", postId);
  };

  // Function to share a post
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

  // Render posts
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
        <h2 className="feed-post-title">{post.title}</h2>
        {post.imageURL && (
          <div className="feed-post-image-container">
            <img
              src={post.imageURL}
              alt={post.description}
              className="feed-post-image"
            />
          </div>
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
            <button
              className="action-button"
              onClick={() => handlePostClick(post.id)}
            >
              <MessageCircle className="action-icon" />
              <span>Comentar</span>
            </button>
            <button
              className="action-button"
              onClick={() => handleSharePost(post.id)}
            >
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
