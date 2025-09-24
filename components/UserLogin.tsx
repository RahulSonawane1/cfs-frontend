import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../constants';

const USER_KEY = 'canteenUsers';

interface UserLoginProps {
  onLogin: (site: string, username: string, token?: string) => void;
}

const UserLogin: React.FC<UserLoginProps> = ({ onLogin }) => {
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sites, setSites] = useState<string[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
  fetch(ENDPOINTS.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) {
          setSites(data.sites.map((s: any) => s.location));
        } else {
          setSites([]);
        }
      })
      .catch(() => setSites([]));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!site || !username || !password) {
      setError('Please fill all fields.');
      return;
    }
    try {
  const res = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
  onLogin(site, username, data.token);
  // Do not navigate here; App.tsx will handle redirect to feedback page
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f4a300 0%, #fffbe6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl" style={{ boxShadow: '0 8px 32px rgba(244,163,0,0.15)' }}>
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="text-center mb-4">
            <img src="https://catalystsolutions.eco/wp-content/uploads/2023/02/logo.png" alt="Catalyst Logo" className="h-16 mx-auto mb-2" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold mb-8 text-center" style={{ color: '#f4a300', letterSpacing: '1px' }}>User Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Select Site</label>
            <select value={site} onChange={e => setSite(e.target.value)} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f4a300]">
              <option value="" disabled>Select a site...</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f4a300]" />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f4a300]" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-[#f4a300] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#e08e00] transition-all shadow-md">Login</button>
        </form>
        <div className="mt-8 text-center">
          <a href="/#/admin-login" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all">Admin Login</a>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
