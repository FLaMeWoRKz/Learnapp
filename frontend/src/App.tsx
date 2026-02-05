import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SinglePlayer from './pages/SinglePlayer';
import Multiplayer from './pages/Multiplayer';
import CustomVocab from './pages/CustomVocab';
import Einstellungen from './pages/Einstellungen';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Lädt...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/singleplayer"
        element={
          <PrivateRoute>
            <SinglePlayer />
          </PrivateRoute>
        }
      />
      <Route
        path="/multiplayer"
        element={
          <PrivateRoute>
            <Multiplayer />
          </PrivateRoute>
        }
      />
      <Route
        path="/custom-vocab"
        element={
          <PrivateRoute>
            <CustomVocab />
          </PrivateRoute>
        }
      />
      <Route
        path="/einstellungen"
        element={
          <PrivateRoute>
            <Einstellungen />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppRoutes />
          </div>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
