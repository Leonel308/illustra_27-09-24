import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import '../../Styles/PostDetails.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const postDocRef = doc(db, 'PostsCollection', postId);
        const postDoc = await getDoc(postDocRef);
        if (postDoc.exists()) {
          const postData = postDoc.data();
          if (!postData.title || !postData.description || !postData.imageURL) {
            setError('Post not found');
            setLoading(false);
            return;
          }
          const userDocRef = doc(db, 'users', postData.userID);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};
          setPost({
            id: postDoc.id,
            ...postData,
            username: userData.username || 'Unknown User',
            userPhotoURL: userData.photoURL || defaultProfilePic,
          });

          const commentsCollectionRef = collection(db, 'PostsCollection', postId, 'comments');
          const commentsSnapshot = await getDocs(commentsCollectionRef);
          const commentsList = commentsSnapshot.docs.map(commentDoc => ({
            id: commentDoc.id,
            ...commentDoc.data()
          }));
          setComments(commentsList);

          const postsCollectionRef = collection(db, 'PostsCollection');
          const postsSnapshot = await getDocs(postsCollectionRef);
          const postsList = await Promise.all(
            postsSnapshot.docs.map(async (postDoc) => {
              const postData = postDoc.data();
              if (postData.userID) {
                const userDocRef = doc(db, 'users', postData.userID);
                const userDoc = await getDoc(userDocRef);
                const userData = userDoc.exists() ? userDoc.data() : {};
                return {
                  id: postDoc.id,
                  ...postData,
                  username: userData.username || 'Unknown User',
                  userPhotoURL: userData.photoURL || defaultProfilePic,
                };
              }
              return null;
            })
          );
          setRecommendedPosts(postsList.filter(post => post && post.id !== postId && post.title && post.description && post.imageURL).slice(0, 5));
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post details: ', error);
        setError('Error fetching post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const comment = {
        username: post.username,
        text: newComment,
        timestamp: new Date(),
      };
      await addDoc(collection(db, 'PostsCollection', postId, 'comments'), comment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="post-details-page">
      <div className="content-area">
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
        </div>
        <div className="comments-section">
          <h3>Comentarios</h3>
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <p><strong>{comment.username}</strong>: {comment.text}</p>
            </div>
          ))}
          <div className="add-comment">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Añade un comentario..."
            ></textarea>
            <button onClick={handleAddComment}>Comentar</button>
          </div>
        </div>
      </div>
      <div className="sidebar">
        <h3>Recommended Posts</h3>
        {recommendedPosts.map(post => (
          <div key={post.id} className="recommended-post" onClick={() => navigate(`/post/${post.id}`)}>
            <img src={post.imageURL} alt={post.title} className="recommended-post-image" />
            <div className="recommended-post-details">
              <div className="recommended-post-author">
                <img src={post.userPhotoURL || defaultProfilePic} alt={post.username} className="recommended-user-photo" />
                <span className="recommended-username">{post.username}</span>
              </div>
              <h4 className="recommended-title">{post.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostDetails;
