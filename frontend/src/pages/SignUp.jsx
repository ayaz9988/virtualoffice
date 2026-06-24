import { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../store/auth';

export default function SignUp() {
  const setAuth = useAuth((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(name, email, password, role);
      setAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Sign Up</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-blue-500"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-blue-500"
          required
        />
        <div className="flex gap-4 mb-6">
          <label className={`flex-1 py-3 rounded-lg text-center font-medium cursor-pointer transition ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
            <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="hidden" />
            Student
          </label>
          <label className={`flex-1 py-3 rounded-lg text-center font-medium cursor-pointer transition ${role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
            <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} className="hidden" />
            Teacher
          </label>
        </div>
        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
          Sign Up
        </button>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Already have an account? <Link to="/signin" className="text-blue-400 hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
