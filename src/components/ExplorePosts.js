import React, { useEffect, useState } from 'react';
import Feed from '../components/Feed/Feed';
import '../Styles/ExplorePosts.css';

const ExplorePosts = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000); // Simula el tiempo de carga

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Feed collectionName="PostsCollection" />
    </div>
  );
};

export default ExplorePosts;
