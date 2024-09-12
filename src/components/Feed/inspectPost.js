import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, arrayRemove, arrayUnion, query, orderBy } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { Heart, Share2, Trash2, Send, MessageCircle } from 'lucide-react';
import './inspectPost.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

export default function InspectPost() {
  const { user } = useContext(UserContext);
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        let postDoc = await getDoc(doc(db, 'PostsCollectionMature', postId));
        
        if (!postDoc.exists()) {
          postDoc = await getDoc(doc(db, 'PostsCollection', postId));
        }
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};
          const commentsCollection = collection(db, `${postDoc.ref.path}/comments`);
          const commentsQuery = query(commentsCollection, orderBy('timestamp', 'desc'));
          const commentsSnapshot = await getDocs(commentsQuery);
          const comments = commentsSnapshot.docs.map(commentDoc => ({
            id: commentDoc.id,
            ...commentDoc.data()
          }));

          setPost({
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Unknown User',
            userPhotoURL: userData.photoURL || defaultProfilePic,
            comments,
          });
          setLikes(postData.likes || 0);
          setIsLiked(postData.likedBy?.includes(user?.uid) || false);
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Error fetching post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, user]);

  const handleAddComment = async () => {
    if (newComment.trim() === '' || newComment.length > 320) return;

    try {
      const comment = {
        comment: newComment,
        timestamp: new Date(),
        user: user.username,
        userPhotoURL: user.photoURL || defaultProfilePic,
        userId: user.uid,
      };
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      const commentRef = await addDoc(collection(db, `${postCollectionPath}/${postId}/comments`), comment);
      setPost(prevPost => ({
        ...prevPost,
        comments: [{ id: commentRef.id, ...comment }, ...(prevPost.comments || [])],
      }));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este comentario?")) return;

    try {
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      await deleteDoc(doc(db, `${postCollectionPath}/${postId}/comments/${commentId}`));
      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.filter(comment => comment.id !== commentId),
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like posts.');
      return;
    }

    try {
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      const postRef = doc(db, postCollectionPath, postId);
      const newLikes = isLiked ? likes - 1 : likes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: isLiked
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });
      setLikes(newLikes);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/inspectPost/${postId}`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: postUrl,
      }).catch((error) => console.error('Error sharing', error));
    } else {
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Enlace copiado al portapapeles');
      }, (error) => {
        console.error('Error copying text', error);
      });
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) return;

    try {
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      await deleteDoc(doc(db, postCollectionPath, postId));
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return <div className="inspect-post-loading">Cargando...</div>;
  }

  if (error) {
    return <div className="inspect-post-error">{error}</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="inspect-post-container">
      <div className="inspect-post-main">
        <div className="inspect-post-header">
          <div className="inspect-post-author">
            <img src={post.userPhotoURL} alt={post.username} className="inspect-user-avatar" />
            <span className="inspect-username">{post.username}</span>
          </div>
          {user?.role === 'admin' && (
            <button className="inspect-action-button inspect-delete-button" onClick={handleDeletePost}>
              <Trash2 className="inspect-action-icon" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
        <h2 className="inspect-post-title">{post.title}</h2>
        <p className="inspect-post-category">
          Categoría: {post.category}
          {post.isAdultContent && <span className="nsfw-tag">NSFW</span>}
        </p>
        {post.imageURL && (
          <div className="inspect-post-image-container">
            <img src={post.imageURL} alt={post.title} className="inspect-post-image" />
          </div>
        )}
        <p className="inspect-post-description">{post.description}</p>
        <div className="inspect-post-actions">
          <button className={`inspect-action-button ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart className="inspect-action-icon" />
            <span>{likes}</span>
          </button>
          <button className="inspect-action-button">
            <MessageCircle className="inspect-action-icon" />
            <span>{post.comments?.length || 0}</span>
          </button>
          <button className="inspect-action-button" onClick={handleShare}>
            <Share2 className="inspect-action-icon" />
            <span>Compartir</span>
          </button>
        </div>
        <div className="inspect-comments-section">
          <h3>Comentarios</h3>
          {user && (
            <div className="inspect-add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añade un comentario..."
                maxLength={320}
              />
              <div className="comment-meta">
                <span>{newComment.length}/320</span>
                <button onClick={handleAddComment} className="inspect-action-button">
                  <Send className="inspect-action-icon" />
                  Comentar
                </button>
              </div>
            </div>
          )}
          {post.comments?.map((comment) => (
            <div key={comment.id} className="inspect-comment">
              <img src={comment.userPhotoURL || defaultProfilePic} alt={comment.user} className="comment-user-avatar" />
              <div className="comment-content">
                <strong>{comment.user}</strong>
                <p>{comment.comment}</p>
              </div>
              {(user?.role === 'admin' || user?.uid === comment.userId) && (
                <div className="delete-comment-container">
                  <button className="delete-comment-button" onClick={() => handleDeleteComment(comment.id)}>
                    <Trash2 className="inspect-action-icon" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
