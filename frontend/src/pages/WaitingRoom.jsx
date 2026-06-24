import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyWaitingStatus } from '../api';

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getMyWaitingStatus(roomId);
        const entry = data.entry;

        if (entry.status === 'admitted') {
          clearInterval(interval);
          if (!entry.zoom_join_url) {
            setStatus('declined');
            return;
          }
          window.open(entry.zoom_join_url, '_blank');
          setStatus('admitted');
        } else if (entry.status === 'declined') {
          clearInterval(interval);
          setStatus('declined');
        }
      } catch {
        // room might not exist anymore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {status === 'waiting' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white text-xl">Waiting for teacher to admit you...</p>
            <p className="text-gray-400 mt-2">You'll be able to join once admitted</p>
          </>
        )}
        {status === 'admitted' && (
          <>
            <p className="text-green-400 text-xl">You've been admitted!</p>
            <p className="text-gray-400 mt-2">Check the opened Zoom tab to join the meeting.</p>
            <button
              onClick={() => navigate('/browse')}
              className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Back to rooms
            </button>
          </>
        )}
        {status === 'declined' && (
          <>
            <p className="text-red-400 text-xl">The teacher declined your request</p>
            <button
              onClick={() => navigate('/browse')}
              className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Back to rooms
            </button>
          </>
        )}
      </div>
    </div>
  );
}
