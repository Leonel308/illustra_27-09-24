import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2, Send } from 'lucide-react';
import '../../Styles/Feed.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

function Feed({ collectionName }) {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, collectionName);
        const q = query(postsCollection, orderBy('timestamp', 'desc'));
        const postsSnapshot = await getDocs(q);
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

  const handleAddComment = async (postId, commentText) => {
    if (commentText.trim() === '') return;

    try {
      const comment = {
        comment: commentText,
        timestamp: new Date(),
        user: user.username,
        userPhotoURL: user.photoURL || defaultProfilePic,
      };
      const commentsCollectionRef = collection(db, `${collectionName}/${postId}/comments`);
      await addDoc(commentsCollectionRef, comment);

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), comment],
          };
        }
        return post;
      }));
      setNewComment('');

      navigate(`/inspectPost/${postId}`);
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      await deleteDoc(doc(db, collectionName, postId));
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post: ', error);
      setError('Error deleting post');
    }
  };

  if (loading) {
    return <div className="feed-loading">Cargando...</div>;
  }

  if (error) {
    return <div className="feed-error">{error}</div>;
  }

  if (posts.length === 0) {
    return <div className="feed-empty">No hay publicaciones para mostrar</div>;
  }

  return (
    <div className="feed-container">
      {posts.map(post => (
        <div 
          key={post.id} 
          className="feed-post"
          onClick={() => navigate(`/inspectPost/${post.id}`)}
        >
          <div className="feed-post-header">
            <img src={post.userPhotoURL} alt={post.username} className="feed-user-avatar" />
            <span className="feed-username">{post.username}</span>
          </div>
          <img src={post.imageURL} alt={post.title} className="feed-post-image" />
          <div className="feed-post-content">
            <h2 className="feed-post-title">{post.title}</h2>
            <p className="feed-post-description">{post.description}</p>
            <p className="feed-post-category">Categoría: {post.category}</p>
            <div className="feed-comments">
              <h3><MessageCircle size={18} /> Comentarios</h3>
              {post.comments?.map((comment, index) => (
                <div key={index} className="feed-comment">
                  <strong>{comment.user}:</strong> {comment.comment}
                </div>
              ))}
              {user && (
                <div className="feed-comment-form" onClick={(e) => e.stopPropagation()}>
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
            {user?.role === 'admin' && (
              <button 
                className="feed-delete-post" 
                onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
              >
                <Trash2 size={18} /> Eliminar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Feed;
