import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import '../Styles/PostDetails.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const PostDetails = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          const userDoc = await getDoc(doc(db, 'users', postData.userID));
          const userData = userDoc.exists() ? userDoc.data() : {};
          setPost({
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Unknown User',
            userPhotoURL: userData.photoURL || defaultProfilePic,
          });
        } else {
          setError('Post not found');
        }

        const commentsSnapshot = await getDocs(collection(db, 'posts', postId, 'comments'));
        const commentsList = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsList);
      } catch (error) {
        console.error('Error fetching post details: ', error);
        setError('Error fetching post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="post-details-container">
      <img src={post.imageURL} alt={post.title} className="post-image" />
      <div className="post-content">
        <div className="post-author">
          <img src={post.userPhotoURL} alt={post.username} className="user-photo" />
          <span className="username">{post.username}</span>
        </div>
        <h2 className="post-title">{post.title}</h2>
        <p className="post-description">{post.description}</p>
      </div>
      <div className="comments-section">
        <h3>Comentarios</h3>
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <p><strong>{comment.username}</strong>: {comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostDetails;
