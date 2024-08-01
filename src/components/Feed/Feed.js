import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import '../../Styles/Feed.css';
import UserContext from '../../context/UserContext';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const Feed = ({ collectionName }) => {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, collectionName);
        const postsSnapshot = await getDocs(postsCollection);
        const postsList = await Promise.all(
          postsSnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();
            if (!postData.userID || !postData.title || !postData.description || !postData.imageURL) {
              console.error('Invalid post data found', postDoc.id);
              return null;
            }
            const userDocRef = doc(db, 'users', postData.userID);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
              console.error('No user document found for', postData.userID);
              return null;
            }
            const userData = userDoc.data();
            return {
              id: postDoc.id,
              ...postData,
              username: userData.username || 'Unknown User',
              userPhotoURL: userData.photoURL || defaultProfilePic,
              title: postData.title.substring(0, 40) // Limita el título a 40 caracteres
            };
          })
        );
        setPosts(postsList.filter(post => post !== null));
      } catch (error) {
        console.error('Error fetching posts: ', error);
        setError('Error fetching posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [collectionName]);

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, collectionName, postId));
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post: ', error);
      setError('Error deleting post');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="feed-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="feed-container">
        <div className="no-posts-message">No hay publicaciones para mostrar</div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <h1>Explora a Otros Artistas</h1>
      <div className="posts-grid">
        {posts.map(post => (
          <div key={post.id} className="post-card" onClick={() => handlePostClick(post.id)}>
            <div className="post-image-container">
              <img src={post.imageURL} alt={post.title} className="post-image" />
            </div>
            <div className="post-details">
              <div className="post-info">
                <img src={post.userPhotoURL} alt={post.username} className="user-photo" />
                <span className="user-name">{post.username}</span>
              </div>
              <h3 className="post-title">{post.title}</h3>
              {user?.role === 'admin' && (
                <button className="delete-post-button" onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}>Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
