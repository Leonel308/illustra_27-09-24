// src/components/Feed/InspectPost.js

import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  query,
  orderBy,
} from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { Heart, Share2, Trash2, Send, MessageCircle } from 'lucide-react';
import styles from './inspectPost.module.css';

const defaultProfilePic =
  'https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886';

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
          const comments = commentsSnapshot.docs.map((commentDoc) => ({
            id: commentDoc.id,
            ...commentDoc.data(),
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
          setError('Publicación no encontrada');
        }
      } catch (error) {
        console.error('Error al obtener la publicación:', error);
        setError('Error al obtener la publicación');
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
      setPost((prevPost) => ({
        ...prevPost,
        comments: [{ id: commentRef.id, ...comment }, ...(prevPost.comments || [])],
      }));
      setNewComment('');
    } catch (error) {
      console.error('Error al añadir comentario:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    try {
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      await deleteDoc(doc(db, `${postCollectionPath}/${postId}/comments/${commentId}`));
      setPost((prevPost) => ({
        ...prevPost,
        comments: prevPost.comments.filter((comment) => comment.id !== commentId),
      }));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para dar me gusta a las publicaciones.');
      return;
    }

    try {
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      const postRef = doc(db, postCollectionPath, postId);
      const newLikes = isLiked ? likes - 1 : likes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setLikes(newLikes);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error al actualizar likes:', error);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/inspectPost/${postId}`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.description,
          url: postUrl,
        })
        .catch((error) => console.error('Error al compartir', error));
    } else {
      navigator.clipboard
        .writeText(postUrl)
        .then(() => {
          alert('Enlace copiado al portapapeles');
        })
        .catch((error) => {
          console.error('Error al copiar texto', error);
        });
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;

    try {
      const postCollectionPath = post.isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';
      await deleteDoc(doc(db, postCollectionPath, postId));
      navigate('/');
    } catch (error) {
      console.error('Error al eliminar publicación:', error);
    }
  };

  if (loading) {
    return <div className={styles.inspectPostLoading}>Cargando...</div>;
  }

  if (error) {
    return <div className={styles.inspectPostError}>{error}</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className={styles.inspectPostContainer}>
      <div className={styles.inspectPostMain}>
        <div className={styles.inspectPostHeader}>
          <div className={styles.inspectPostAuthor}>
            <img src={post.userPhotoURL} alt={post.username} className={styles.inspectUserAvatar} />
            <span className={styles.inspectUsername}>{post.username}</span>
          </div>
          {user?.role === 'admin' && (
            <button className={`${styles.inspectActionButton} ${styles.inspectDeleteButton}`} onClick={handleDeletePost}>
              <Trash2 className={styles.inspectActionIcon} />
              <span>Eliminar</span>
            </button>
          )}
        </div>
        <h2 className={styles.inspectPostTitle}>{post.title}</h2>
        <p className={styles.inspectPostCategory}>
          Categoría: {post.category}
          {post.isAdultContent && <span className={styles.nsfwTag}>NSFW</span>}
        </p>
        {post.imageURL && (
          <div className={styles.inspectPostImageContainer}>
            <img src={post.imageURL} alt={post.title} className={styles.inspectPostImage} />
          </div>
        )}
        <p className={styles.inspectPostDescription}>{post.description}</p>
        <div className={styles.inspectPostActions}>
          <button className={`${styles.inspectActionButton} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
            <Heart className={styles.inspectActionIcon} />
            <span>{likes}</span>
          </button>
          <button className={styles.inspectActionButton} aria-label="Número de Comentarios">
            <MessageCircle className={styles.inspectActionIcon} />
            <span>{post.comments?.length || 0}</span>
          </button>
          <button className={styles.inspectActionButton} onClick={handleShare} aria-label="Compartir">
            <Share2 className={styles.inspectActionIcon} />
            <span>Compartir</span>
          </button>
        </div>
        <div className={styles.inspectCommentsSection}>
          <h3>Comentarios</h3>
          {user && (
            <div className={styles.inspectAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añade un comentario..."
                maxLength={320}
                className={styles.addCommentTextarea}
              />
              <div className={styles.commentMeta}>
                <span>{newComment.length}/320</span>
                <button onClick={handleAddComment} className={`${styles.inspectActionButton} ${styles.commentButton}`}>
                  <Send className={styles.inspectActionIcon} />
                  Comentar
                </button>
              </div>
            </div>
          )}
          {post.comments?.map((comment) => (
            <div key={comment.id} className={styles.inspectComment}>
              <img src={comment.userPhotoURL || defaultProfilePic} alt={comment.user} className={styles.commentUserAvatar} />
              <div className={styles.commentContent}>
                <strong>{comment.user}</strong>
                <p>{comment.comment}</p>
              </div>
              {(user?.role === 'admin' || user?.uid === comment.userId) && (
                <div className={styles.deleteCommentContainer}>
                  <button className={styles.deleteCommentButton} onClick={() => handleDeleteComment(comment.id)}>
                    <Trash2 className={styles.inspectActionIcon} />
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