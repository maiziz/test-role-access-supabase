import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, School } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First, create a new user if they don't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError && signUpError.message !== 'User already registered') {
        throw signUpError;
      }

      // Then sign in
      await signIn(email, password, role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Auth error:', err);
    }
  };

  // Test database connection
  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Database error:', error);
        setError('Database connection failed');
      } else {
        console.log('Database connected successfully:', data);
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setError('Database connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <School className="h-12 w-12 text-indigo-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
          <button
            onClick={testConnection}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            Test Connection
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={role}
              onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}