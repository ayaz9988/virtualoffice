import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToEvents } from '../api';

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const source = subscribeToEvents();

    source.addEventListener('status-changed', (e) => {
      const data = JSON.parse(e.data);
      if (data.meeting_number || data.status === 'admitted') {
        setStatus('admitted');
        if (data.meeting_number) {
          const joinUrl = data.zoom_join_url || `https://zoom.us/j/${data.meeting_number}?pwd=${data.zoom_password}`;
          window.open(joinUrl, '_blank');
        }
      } else {
        setStatus('declined');
      }
    });

    return () => source.close();
  }, [roomId]);

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
