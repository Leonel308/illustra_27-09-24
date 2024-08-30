import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where, limit, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import './RightSideBar.css'; // Importa el archivo CSS

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";

const RightSidebar = () => {
  const { user } = useContext(UserContext);
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  // Obtener usuarios destacados
  useEffect(() => {
    const fetchFeaturedUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.photoURL && user.bio);
        const shuffledUsers = usersList.sort(() => 0.5 - Math.random());
        setFeaturedUsers(shuffledUsers.slice(0, 5));
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };
    fetchFeaturedUsers();
  }, []);

  // Obtener posts recomendados
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, 'PostsCollection');
        const q = query(postsCollection, where("isAdultContent", "==", false), limit(5)); // Limitar a 5 posts
        const postsSnapshot = await getDocs(q);
        const postsList = await Promise.all(
          postsSnapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();
            const userDocRef = doc(db, 'users', postData.userID);
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data();
            return {
              id: postDoc.id,
              ...postData,
              username: userData.username || 'Unknown User',
              userPhotoURL: userData.photoURL || defaultProfilePic,
              title: postData.title.substring(0, 40),
            };
          })
        );
        setPosts(postsList.filter(post => post !== null));
      } catch (error) {
        console.error('Error fetching posts: ', error);
      }
    };
    fetchPosts();
  }, []);

  // Función para eliminar un post
  const handleDeletePost = async (postId) => {
    if (user?.role !== 'admin') {
      console.error('No tienes permiso para eliminar esta publicación.');
      return;
    }

    if (window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
      try {
        await deleteDoc(doc(db, 'PostsCollection', postId));
        setPosts(posts.filter(post => post.id !== postId));
        console.log('Publicación eliminada con éxito.');
      } catch (error) {
        console.error('Error al eliminar la publicación: ', error);
      }
    }
  };

  return (
    <div className="sidebar-right">
      <div className="search-bar">
        <input type="text" placeholder="Buscar en Illustra" />
      </div>

      <div className="featured-users-container">
        <h3>Usuarios Destacados</h3>
        <div className="featured-users-vertical">
          {featuredUsers.map((user, index) => (
            <div key={index} className="featured-user-card-vertical" onClick={() => navigate(`/profile/${user.id}`)}>
              <img src={user.photoURL || defaultProfilePic} alt={user.username} className="user-photo-vertical" />
              <div className="user-info-vertical">
                <h4>{user.username}</h4>
                <p>{user.bio.length > 50 ? user.bio.substring(0, 50) + '...' : user.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="recommended-posts-container">
        <h3>Posts Recomendados</h3>
        <div className="posts-vertical">
          {posts.map(post => (
            <div key={post.id} className="post-card-vertical" onClick={() => navigate(`/inspectPost/${post.id}`)}>
              <div className="post-image-container-vertical">
                <img src={post.imageURL} alt={post.title} className="post-image-vertical" />
              </div>
              <div className="post-details-vertical">
                <div className="post-info-vertical">
                  <img src={post.userPhotoURL} alt={post.username} className="user-photo-vertical" />
                  <span className="user-name-vertical">{post.username}</span>
                </div>
                <h3 className="post-title-vertical">{post.title}</h3>
                {user?.role === 'admin' && (
                  <button className="delete-post-button-vertical" onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}>Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
