import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Register from './components/register';
import Profile from './components/Profile/Profile';
import ProfilePortfolio from './components/Profile/ProfilePortfolio';
import CreatePost from './components/CreatePost';
import ExplorePosts from './components/ExplorePosts';
import ExplorePostsMature from './components/ExplorePostsMature';
import ForgotPassword from './components/forgotPassword';
import VerifyEmail from './components/VerifyEmail';
import TermsAndConditions from './components/TermsAndConditions';
import Configuration from './components/Configuration';
import PasswordResetSent from './components/PasswordResetSent';
import SuccessPage from './PaymentsStatus/Success';
import FailurePage from './PaymentsStatus/Failure';
import PendingPage from './PaymentsStatus/Pending';
import CallbackPage from './components/CallbackPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import PostDetails from './components/Feed/PostsDetails';
import Workbench from './components/Workbench';
import ServiceRequest from './components/ServiceRequest';
import Notifications from './components/Notifications';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/profile/:userId" element={<Layout><Profile /></Layout>} />
          <Route path="/profile/:userId/portfolio" element={<Layout><ProfilePortfolio /></Layout>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/create-post" element={<Layout><CreatePost /></Layout>} />
          <Route path="/explore-posts" element={<Layout><ExplorePosts /></Layout>} />
          <Route path="/explore-posts-mature" element={<Layout><ExplorePostsMature /></Layout>} />
          <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
          <Route path="/configuration" element={<Layout><Configuration /></Layout>} />
          <Route path="/password-reset-sent" element={<Layout><PasswordResetSent /></Layout>} />
          <Route path="/success" element={<Layout><SuccessPage /></Layout>} />
          <Route path="/failure" element={<Layout><FailurePage /></Layout>} />
          <Route path="/pending" element={<Layout><PendingPage /></Layout>} />
          <Route path="/mercadopago/callback" element={<Layout><CallbackPage /></Layout>} />
          <Route path="/dashboard" element={<Layout><UserDashboard /></Layout>} />
          <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
          <Route path="/post/:postId" element={<Layout><PostDetails /></Layout>} />
          <Route path="/workbench" element={<Layout><Workbench /></Layout>} />
          <Route path="/service-request/:userId/:serviceId" element={<Layout><ServiceRequest /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
