// RightSidebar.js

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where, limit, deleteDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import styles from './RightSideBar.module.css'; // Importación de CSS Modules

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
            if (postData.title && postData.imageURL) { // Filtrar posts que tienen título e imagen
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
            }
            return null;
          })
        );
        setPosts(postsList.filter(post => post !== null)); // Filtrar los posts nulos
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
    <div className={styles.sidebarRight}>
      <div className={styles.searchBar}>
        <input type="text" placeholder="Buscar en Illustra" className={styles.searchInput} />
      </div>

      <div className={styles.featuredUsersContainer}>
        <h3 className={styles.sectionTitle}>Usuarios Destacados</h3>
        <div className={styles.featuredUsersVertical}>
          {featuredUsers.map((user, index) => (
            <div key={index} className={styles.featuredUserCardVertical} onClick={() => navigate(`/profile/${user.id}`)}>
              <img src={user.photoURL || defaultProfilePic} alt={user.username} className={styles.userPhotoVertical} />
              <div className={styles.userInfoVertical}>
                <h4 className={styles.usernameVertical}>{user.username}</h4>
                <p className={styles.bioVertical}>{user.bio.length > 50 ? user.bio.substring(0, 50) + '...' : user.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recommendedPostsContainer}>
        <h3 className={styles.sectionTitle}>Posts Recomendados</h3>
        <div className={styles.postsVertical}>
          {posts.map(post => (
            <div key={post.id} className={styles.postCardVertical} onClick={() => navigate(`/inspectPost/${post.id}`)}>
              <div className={styles.postImageContainerVertical}>
                <img src={post.imageURL} alt={post.title} className={styles.postImageVertical} />
              </div>
              <div className={styles.postDetailsVertical}>
                <div className={styles.postInfoVertical}>
                  <img src={post.userPhotoURL} alt={post.username} className={styles.userPhotoVertical} />
                  <span className={styles.userNameVertical}>{post.username}</span>
                </div>
                <h3 className={styles.postTitleVertical}>{post.title}</h3>
                {user?.role === 'admin' && (
                  <button className={styles.deletePostButtonVertical} onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}>
                    Eliminar
                  </button>
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
