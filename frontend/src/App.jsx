import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import TeacherRoom from './pages/TeacherRoom';
import StudentBrowse from './pages/StudentBrowse';
import WaitingRoom from './pages/WaitingRoom';
import ZoomMeeting from './pages/ZoomMeeting';
import { useAuth } from './store/auth';

function ProtectedRoute({ children }) {
  const token = useAuth((s) => s.token);
  return token ? children : <Navigate to="/signin" replace />;
}

function App() {
  const token = useAuth((s) => s.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={token ? <Navigate to="/dashboard" replace /> : <SignIn />} />
        <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <SignUp />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/room" element={<ProtectedRoute><TeacherRoom /></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute><StudentBrowse /></ProtectedRoute>} />
        <Route path="/waiting/:roomId" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
        <Route path="/meeting/:roomId" element={<ProtectedRoute><ZoomMeeting /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/signin'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
