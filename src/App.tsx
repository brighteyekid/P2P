import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import Skills from './pages/skills/Skills';
import Connections from './pages/connections/Connections';
import ChatList from './pages/chat/ChatList';
import Chat from './pages/chat/Chat';
import SkillExchanges from './pages/skills/SkillExchanges';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/shared/Layout';
import { AnimatePresence } from 'framer-motion';

// Routes with AnimatePresence for transitions
const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skills"
          element={
            <ProtectedRoute>
              <Layout>
                <Skills />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-exchanges"
          element={
            <ProtectedRoute>
              <Layout>
                <SkillExchanges />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <Layout>
                <Connections />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exchanges"
          element={
            <ProtectedRoute>
              <Layout>
                <SkillExchanges />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
