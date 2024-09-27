// src/components/ProtectedRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import UserContext from '../context/UserContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    // Puedes reemplazar esto con un componente de carga personalizado
    return <div>Cargando...</div>;
  }

  if (!user) {
    // Redirigir al usuario a la página de inicio de sesión si no está autenticado
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
