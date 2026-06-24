import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'teacher') {
      navigate('/room', { replace: true });
    } else {
      navigate('/browse', { replace: true });
    }
  }, [user, navigate]);

  return null;
}
