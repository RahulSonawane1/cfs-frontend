import React, { useEffect, useState } from 'react';
import { ENDPOINTS } from '../constants';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ site: '', username: '', password: '' });
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editingUser, setEditingUser] = useState({ site: '', username: '', password: '' });
  const [sites, setSites] = useState<string[]>([]);
  // Fetch available sites for dropdown
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

  const fetchUsers = async () => {
    setError('');
    try {
  const res = await fetch(ENDPOINTS.ADMIN_USERS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
  const res = await fetch(ENDPOINTS.SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');
      setForm({ site: '', username: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditingUser({ site: user.site, username: user.username, password: '' });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleSave = async (id: number) => {
    setError('');
    try {
  const res = await fetch(`${ENDPOINTS.ADMIN_USERS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setEditingId(null);
      setEditingUser({ site: '', username: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
  const res = await fetch(`${ENDPOINTS.ADMIN_USERS}/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
  <div className="max-w-2xl mx-auto bg-white p-4 rounded-xl shadow-xl mt-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-2 mb-4 shadow flex items-center justify-between px-3">
  <h2 className="text-xl font-bold text-white">Manage Users</h2>
        <span className="text-white font-semibold text-base">Total: {users.length}</span>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
  <form onSubmit={handleAddUser} className="mb-4 flex gap-2 items-end font-light text-sm">
  <select name="site" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} className="border p-1 rounded w-24" required>
          <option value="">Select Site</option>
          {sites.map(site => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
  <input name="username" value={form.username} onChange={handleInputChange} placeholder="Username" className="border p-1 rounded w-24 font-light" required />
  <input name="password" value={form.password} onChange={handleInputChange} placeholder="Password" className="border p-1 rounded w-24 font-light" required type="password" />
  <button type="submit" className="bg-primary-600 text-white px-2 py-1 rounded font-bold text-xs">Add User</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-4 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Site</th>
              <th className="p-2 border">Username</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any, idx: number) => (
              <tr key={user.id} className={"transition-colors duration-200 " + (idx % 2 === 0 ? "bg-white" : "bg-gray-50") + " hover:bg-primary-50 text-xs"}>
                <td className="p-2 border font-mono">{user.id}</td>
                <td className="p-2 border">{editingId === user.id ? (
                  <select name="site" value={editingUser.site} onChange={handleEditInputChange} className="border p-1 rounded w-20 font-light text-xs">
                    <option value="">Select Site</option>
                    {sites.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                ) : user.site}</td>
                <td className="p-2 border">{editingId === user.id ? (
                  <input name="username" value={editingUser.username} onChange={handleEditInputChange} className="border p-1 rounded w-20 font-light text-xs" />
                ) : user.username}</td>
                <td className="p-2 border">
                  {editingId === user.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(user.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="bg-blue-600 hover:bg-blue-700 text-white px-1 py-0.5 rounded text-xs">Edit</button>
                      <button onClick={() => handleDelete(user.id)} className="bg-red-600 hover:bg-red-700 text-white px-1 py-0.5 rounded text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="text-gray-500 text-center">No users found.</p>}
    </div>
  );
};

export default AdminUsers;
