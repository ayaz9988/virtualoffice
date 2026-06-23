import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { useAuth } from './store/auth';

function App() {
  const token = useAuth((s) => s.token);

  if (token) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-2xl">Logged In</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
