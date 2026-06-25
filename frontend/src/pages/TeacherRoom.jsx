import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRoom, createRoom, updateRoom, deleteRoom, getWaitingQueue, admitStudent, declineStudent, subscribeToEvents } from '../api';
import { useAuth } from '../store/auth';

export default function TeacherRoom() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [room, setRoom] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyRoom()
      .then((data) => { if (!cancelled) setRoom(data.rooms); })
      .catch(() => { if (!cancelled) setRoom(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;

    const fetchQueue = async () => {
      try {
        const data = await getWaitingQueue(room.id);
        if (!cancelled) setQueue(data.listOfWaitingStudent);
      } catch {
        if (!cancelled) setQueue([]);
      }
    };

    fetchQueue();

    const source = subscribeToEvents();
    source.addEventListener('waiting-queue-changed', fetchQueue);

    return () => {
      cancelled = true;
      source.close();
    };
  }, [room]);

  const refreshQueue = useCallback(async () => {
    if (!room) return;
    try {
      const data = await getWaitingQueue(room.id);
      setQueue(data.listOfWaitingStudent);
    } catch {
      setQueue([]);
    }
  }, [room]);

  const handleCreate = async () => {
    try {
      const data = await createRoom();
      setRoom(data.room);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async () => {
    if (!room) return;
    try {
      const data = await updateRoom(room.id, { is_open: room.is_open ? 0 : 1 });
      setRoom((prev) => ({ ...prev, ...data.room }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your room? This cannot be undone.')) return;
    try {
      await deleteRoom(room.id);
      setRoom(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdmit = async (waitingId) => {
    try {
      await admitStudent(waitingId);
      refreshQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDecline = async (waitingId) => {
    try {
      await declineStudent(waitingId);
      refreshQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.name}</span>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">Logout</button>
          </div>
        </div>

        {!room ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">You don't have a room yet</p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Create Room
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-white font-semibold text-lg">{room.name}</h2>
                  {room.topic && <p className="text-gray-400 text-sm mt-1">{room.topic}</p>}
                  <p className={`text-sm mt-2 ${room.is_open ? 'text-green-400' : 'text-gray-500'}`}>
                    {room.is_open ? '● Open' : '○ Closed'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {room.is_open && room.zoom_start_url && (
                    <a
                      href={room.zoom_start_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Desktop App
                    </a>
                  )}
                  <button
                    onClick={handleToggle}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      room.is_open
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {room.is_open ? 'Close Room' : 'Open Room'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-white font-semibold text-lg mb-3">Waiting Queue ({queue.length})</h3>

            {queue.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No students waiting</p>
            ) : (
              <div className="space-y-3">
                {queue.map((entry) => (
                  <div key={entry.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{entry.student_name}</p>
                      <p className="text-gray-400 text-sm">{entry.student_email}</p>
                      {entry.note && <p className="text-gray-500 text-xs mt-1">"{entry.note}"</p>}
                      <p className="text-gray-600 text-xs mt-1">Waiting since {new Date(entry.waiting_since).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdmit(entry.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        Admit
                      </button>
                      <button
                        onClick={() => handleDecline(entry.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
