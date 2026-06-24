import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getZoomSignature } from '../api';
import ZoomView from '../components/ZoomView';
import { useAuth } from '../store/auth';

export default function ZoomMeeting() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuth((s) => s.user);

  const fromState = location.state;
  const meetingNumber = fromState?.meetingNumber || searchParams.get('meetingNumber');
  const password = fromState?.password || searchParams.get('password');
  const role = Number(fromState?.role || searchParams.get('role') || 0);
  const [meetingData, setMeetingData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!meetingNumber || !password) return;

    let cancelled = false;
    getZoomSignature(meetingNumber, role)
      .then((data) => {
        if (!cancelled) {
          setMeetingData({
            meetingNumber,
            password,
            signature: data.signature,
            zak: data.zak,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [meetingNumber, password, role]);

  if (!meetingNumber || !password) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">Missing meeting details</p>
          <button
            onClick={() => navigate(role === 1 ? '/room' : '/browse')}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error}</p>
          <button
            onClick={() => navigate(role === 1 ? '/room' : '/browse')}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ZoomView
      meetingNumber={meetingData.meetingNumber}
      password={meetingData.password}
      signature={meetingData.signature}
      zak={meetingData.zak}
      userName={user?.name || 'User'}
      onLeave={() => navigate(role === 1 ? '/room' : '/browse', { replace: true })}
    />
  );
}
