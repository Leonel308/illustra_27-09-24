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
import LearnMore from './components/HomeComponents/LearnMore'; // Importamos el nuevo componente LearnMore
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/create-post" element={<Layout><CreatePost /></Layout>} />
          <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
          <Route path="/configuration" element={<Layout><Configuration /></Layout>} />
          <Route path="/success" element={<Layout><SuccessPage /></Layout>} />
          <Route path="/failure" element={<Layout><FailurePage /></Layout>} />
          <Route path="/pending" element={<Layout><PendingPage /></Layout>} />
          <Route path="/mercadopago/callback" element={<CallbackPage />} />
          <Route path="/dashboard" element={<Layout><UserDashboard /></Layout>} />
          <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
          <Route path="/workbench" element={<Layout><Workbench /></Layout>} />
          <Route path="/service-request/:illustratorID/:serviceId" element={<Layout><ServiceRequest /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/service-details-worker/:requestId/:clientId" element={<Layout><ServiceDetailsWorker /></Layout>} />
          <Route path="/service-details-user/:requestId/:clientId" element={<Layout><ServiceDetailsUser /></Layout>} />
          <Route path="/inspectPost/:postId" element={<Layout><InspectPost /></Layout>} />
          <Route path="/explore-posts" element={<Layout><ExplorePosts /></Layout>} />
          <Route path="/exploreServices" element={<Layout><ExploreServices /></Layout>} />
          <Route path="/learn-more" element={<Layout><LearnMore /></Layout>} /> {/* Nueva ruta para LearnMore */}
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
