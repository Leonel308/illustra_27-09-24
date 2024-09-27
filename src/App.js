// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Register from './components/register';
import Profile from './components/Profile/Profile';
import CreatePost from './components/CreatePost';
import ForgotPassword from './components/forgotPassword';
import VerifyEmail from './components/VerifyEmail';
import TermsAndConditions from './components/TermsAndConditions';
import Configuration from './components/Configuration';
import SuccessPage from './PaymentsStatus/Success';
import FailurePage from './PaymentsStatus/Failure';
import PendingPage from './PaymentsStatus/Pending';
import CallbackPage from './components/MercadoPago/CallbackPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Workbench from './components/Workbench';
import ServiceRequest from './components/Services/ServiceRequest';
import Notifications from './components/Notifications';
import ServiceDetailsWorker from './components/Services/ServiceDetailsWorker';
import ServiceDetailsUser from './components/Services/ServiceDetailsUser';
import InspectPost from './components/Feed/inspectPost';
import ExplorePosts from './components/explorePosts';
import ExploreServices from './components/Explore Services/exploreServices';
import ExploreUsers from './components/HomeComponents/ExploreUsers';
import LearnMore from './components/HomeComponents/LearnMore';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/mercadopago/callback" element={<CallbackPage />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
          <Route path="/learn-more" element={<Layout><LearnMore /></Layout>} />
          <Route path="/explore-posts" element={<Layout><ExplorePosts /></Layout>} />
          <Route path="/exploreServices" element={<Layout><ExploreServices /></Layout>} />
          <Route path="/explore-users" element={<Layout><ExploreUsers /></Layout>} />

          {/* Rutas Protegidas */}
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-post"
            element={
              <ProtectedRoute>
                <Layout><CreatePost /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuration"
            element={
              <ProtectedRoute>
                <Layout><Configuration /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <Layout><SuccessPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/failure"
            element={
              <ProtectedRoute>
                <Layout><FailurePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending"
            element={
              <ProtectedRoute>
                <Layout><PendingPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><UserDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workbench"
            element={
              <ProtectedRoute>
                <Layout><Workbench /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-request/:illustratorID/:serviceId"
            element={
              <ProtectedRoute>
                <Layout><ServiceRequest /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout><Notifications /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-details-worker/:requestId/:clientId"
            element={
              <ProtectedRoute>
                <Layout><ServiceDetailsWorker /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-details-user/:requestId/:clientId"
            element={
              <ProtectedRoute>
                <Layout><ServiceDetailsUser /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspectPost/:postId"
            element={
              <ProtectedRoute>
                <Layout><InspectPost /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
