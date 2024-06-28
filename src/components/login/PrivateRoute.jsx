// src/components/login/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

const PrivateRoute = ({ component: Component }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>; // Or any loading component you want
  }

  if (error) {
    return <div>Error: {error.message}</div>; // Or any error component you want
  }

  return user ? <Component /> : <Navigate to="/login" />;
};

export default PrivateRoute;
