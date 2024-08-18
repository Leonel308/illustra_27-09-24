import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import './inspectPost.css';
import UserContext from '../../context/UserContext';
import RecomendedPosts from '../RecomendedPosts';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const InspectPost = () => {
  const { user } = useContext(UserContext);
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Intentar obtener el post de la colección "PostsCollectionMature"
        let postDoc = await getDoc(doc(db, 'PostsCollectionMature', postId));
        
        // Si no existe, buscar en la colección "PostsCollection"
        if (!postDoc.exists()) {
          postDoc = await getDoc(doc(db, 'PostsCollection', postId));
        }
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};
          const commentsCollection = collection(db, `${postDoc.ref.path}/comments`);
          const commentsSnapshot = await getDocs(commentsCollection);
          const comments = commentsSnapshot.docs.map(commentDoc => commentDoc.data());

          setPost({
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Unknown User',
            userPhotoURL: userData.photoURL || defaultProfilePic,
            comments,
          });
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
  }, [postId]);

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const comment = {
        comment: newComment,
        timestamp: new Date(),
        user: user.username,
      };
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      await addDoc(collection(db, `${postCollectionPath}/${postId}/comments`), comment);
      setPost(prevPost => ({
        ...prevPost,
        comments: [...(prevPost.comments || []), comment],
      }));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="inspect-post-loading-container">
        <div className="inspect-post-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inspect-post-container">
        <div className="inspect-post-error-message">{error}</div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="inspect-post-page">
      <div className="inspect-post-main">
        <div className="inspect-post-details">
          <div className="inspect-post-author">
            <img src={post.userPhotoURL} alt={post.username} className="inspect-user-photo" />
            <span className="inspect-user-name">{post.username}</span>
          </div>
          <h2 className="inspect-post-title">{post.title}</h2>
          <p className="inspect-post-category">{post.category}</p> {/* Muestra la categoría */}
          <img src={post.imageURL} alt={post.title} className="inspect-post-image" />
          <p className="inspect-post-description">{post.description}</p>
        </div>
        <div className="inspect-comments-section">
          <h3>Comentarios</h3>
          {post.comments?.map((comment, index) => (
            <div key={index} className="inspect-comment">
              <p><strong>{comment.user}</strong>: {comment.comment}</p>
            </div>
          ))}
          {user && (
            <div className="inspect-add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añade un comentario..."
              ></textarea>
              <button onClick={handleAddComment}>Comentar</button>
            </div>
          )}
        </div>
      </div>
      <div className="inspect-post-sidebar">
        <h3>Post Recomendados</h3>
        <RecomendedPosts 
          category={post.category} 
          collectionName={post.isAdultContent ? "PostsCollectionMature" : "PostsCollection"} 
        /> {/* Display recommended posts */}
      </div>
    </div>
  );
};

export default InspectPost;
