import React, { useEffect, useState, useContext } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, orderBy, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2, Send, Heart, Share2 } from 'lucide-react';
import '../../Styles/Feed.css';

function Feed({ collectionName, searchTerm = '', activeCategory = 'Todos' }) {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState('');
  const [characterCount, setCharacterCount] = useState(0); // Para el conteo de caracteres
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
            if (!postData || !postData.userID || !postData.description) {
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
              userPhotoURL: userData.photoURL || '',
              commentsOpen: false,
              isLiked: postData.likedBy?.includes(user?.uid) || false,
            };
          })
        );

        const validPosts = postsList.filter(post => post !== null);

        const filteredPosts = validPosts.filter(post => {
          const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = activeCategory === 'Todos' || post.category.toLowerCase().includes(activeCategory.toLowerCase());
          return matchesSearch && matchesCategory;
        });

        setPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching posts: ', error);
        setError('Error fetching posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [collectionName, searchTerm, activeCategory]);

  const handleAddComment = async (postId, commentText) => {
    if (commentText.trim() === '') return;

    try {
      const comment = {
        comment: commentText,
        timestamp: new Date(),
        user: user.username,
        userPhotoURL: user.photoURL || '',
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

  const handleNewPost = async () => {
    if (newPost.trim() === '' || characterCount > 360) return;  // Limitar a 360 caracteres

    try {
      const post = {
        title: newPost.substring(0, 60) || 'Sin título',  // Usa los primeros 60 caracteres como título o 'Sin título'
        description: newPost,
        imageURL: '',  // No imagen por defecto
        userID: user.uid,
        timestamp: new Date(),
        category: 'General',
        likes: 0,
        likedBy: [],
      };
      const postsCollectionRef = collection(db, collectionName);
      await addDoc(postsCollectionRef, post);
      setNewPost('');
      setCharacterCount(0);  // Restablecer el conteo de caracteres
      const updatedPosts = [post, ...posts];
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Error adding post: ', error);
    }
  };

  const handleLikePost = async (postId, currentLikes, isLiked) => {
    try {
      const postRef = doc(db, collectionName, postId);
      const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likedBy: isLiked
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid)
      });

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: newLikes,
            isLiked: !isLiked,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleToggleComments = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          commentsOpen: !post.commentsOpen,
        };
      }
      return post;
    }));
  };

  const handleSharePost = (postId) => {
    const postUrl = `${window.location.origin}/inspectPost/${postId}`;
    if (navigator.share) {
      navigator.share({
        title: "Check out this post!",
        text: "Here is something interesting!",
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
        {post.imageURL && <img src={post.imageURL} alt={post.title} className="feed-post-image" />}
        <div className="feed-post-content">
          <h2 className="feed-post-title">{post.title}</h2>
          <p className="feed-post-description">{post.description}</p>
          <p className="feed-post-category">Categoría: {post.category}</p>
          <div className="feed-post-actions">
            <button
              className={`action-button ${post.isLiked ? 'liked' : ''}`}
              onClick={() => handleLikePost(post.id, post.likes, post.isLiked)}
            >
              <Heart className="action-icon" />
              <span>{post.likes}</span>
            </button>
            <button className="action-button" onClick={() => handleSharePost(post.id)}>
              <Share2 className="action-icon" />
              <span>Compartir</span>
            </button>
            <button className="action-button" onClick={() => handleToggleComments(post.id)}>
              <MessageCircle className="action-icon" />
              <span>Comentar</span>
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
          <div className={`feed-comments ${post.commentsOpen ? 'open' : ''}`}>
            {post.comments?.map((comment, index) => (
              <div key={index} className="feed-comment">
                <img src={comment.userPhotoURL} alt={comment.user} className="comment-user-avatar" />
                <div className="comment-content">
                  <strong>{comment.user}:</strong> {comment.comment}
                </div>
              </div>
            ))}
          </div>
          {post.commentsOpen && user && (
            <div className="feed-comment-form">
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
      </div>
    ));
  };

  return (
    <div className="feed-container">
      <div className="new-post-form">
        <textarea
          value={newPost}
          onChange={(e) => {
            setNewPost(e.target.value);
            setCharacterCount(e.target.value.length);
          }}
          placeholder="¿Qué está pasando?"
          maxLength={360}  // Límite de 360 caracteres
        />
        <small>{characterCount}/360 caracteres</small> {/* Contador de caracteres */}
        <button onClick={handleNewPost} className="publish-button">Publicar</button>
      </div>
      {renderPosts()}
    </div>
  );
}

export default Feed;
