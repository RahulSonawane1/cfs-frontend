
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../constants';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
  const res = await fetch(ENDPOINTS.ADMIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid password. Please try again.');
        setIsLoading(false);
        return;
      }
      // Store JWT token for admin
      localStorage.setItem('canteenAdminJWT', data.token);
      navigate('/admin');
    } catch (err) {
      setError('Network error');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 bg-gradient-to-r from-primary-100 to-primary-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
         {/*} <img src="/images/clogo.png" alt="Catalyst Logo" className="h-16 mx-auto mb-4" />*/}
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-gray-600">Enter your password to access the dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="text-sm font-bold text-gray-600 block">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-2 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 focus:bg-white"
              placeholder="••••••••"
            />
             <p className='text-xs text-gray-400 mt-1'>Hint: admin123</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/user-login')}
              className="w-full flex justify-center py-2 px-4 border border-primary-600 rounded-lg shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              User Login
            </button>
          </div>
      </div>
    </div>
  );
};

export default AdminLogin;
