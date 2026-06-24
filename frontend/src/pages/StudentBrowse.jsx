import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenRooms, joinWaitingRoom } from '../api';
import { useAuth } from '../store/auth';

export default function StudentBrowse() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getOpenRooms().then((data) => setRooms(data.rooms)).catch(() => {});
  }, []);

  const handleJoin = async (roomId) => {
    try {
      await joinWaitingRoom(roomId);
      navigate(`/waiting/${roomId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Open Rooms</h1>
          <span className="text-gray-400">Welcome, {user?.name}</span>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {rooms.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">No open rooms right now</p>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-gray-800 rounded-xl p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-white font-semibold text-lg">{room.name}</h2>
                  {room.topic && <p className="text-gray-400 text-sm mt-1">{room.topic}</p>}
                  {room.description && <p className="text-gray-500 text-sm mt-1">{room.description}</p>}
                </div>
                <button
                  onClick={() => handleJoin(room.id)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
