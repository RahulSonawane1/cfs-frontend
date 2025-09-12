import React, { useState, useEffect } from 'react';
import { RATINGS, ENDPOINTS } from '../constants';
import { FaEdit, FaTrash, FaSave, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

const AdminQuestions = () => {
  const [site, setSite] = useState('');
  const [sites, setSites] = useState<string[]>([]);
  // Fetch dynamic site list on mount
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
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingEmoji, setEditingEmoji] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (site) fetchQuestions(site);
  }, [site]);

  const fetchQuestions = async (site: string) => {
    setError('');
    try {
  const res = await fetch(`${ENDPOINTS.QUESTIONS}?site=${encodeURIComponent(site)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch questions');
      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdd = async () => {
    if (!site || !newQuestion.trim()) return;
    setError('');
    try {
  const res = await fetch(ENDPOINTS.QUESTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, question_text: newQuestion, emoji: newEmoji })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add question');
      setNewQuestion('');
      setNewEmoji('');
      fetchQuestions(site);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editingText.trim()) return;
    setError('');
    try {
  const res = await fetch(`${ENDPOINTS.QUESTIONS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_text: editingText, emoji: editingEmoji })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit question');
      setEditingId(null);
      setEditingText('');
      setEditingEmoji('');
      fetchQuestions(site);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
  const res = await fetch(`${ENDPOINTS.QUESTIONS}/${id}`, {
        method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question');
      fetchQuestions(site);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
  <div className="max-w-sm mx-auto bg-white p-2 rounded-xl shadow-lg mt-6 border border-gray-200">
    <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded py-1 mb-3 shadow flex items-center justify-between px-3">
  <h2 className="text-base font-semibold text-white flex items-center gap-2"><span className="icon icon-mb"><FaQuestionCircle /></span> Manage Feedback Questions</h2>
      {site && <span className="text-white font-semibold text-xs">{questions.length}</span>}
    </div>
    <div className="mb-2">
      <label className="block mb-1 font-semibold text-xs">Select Site</label>
      <select value={site} onChange={e => setSite(e.target.value)} required className="w-full p-2 rounded border border-gray-300 text-xs">
        <option value="" disabled>Select a site...</option>
        {sites.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
    {site && (
      <>
        <div className="mb-3">
          <label className="block mb-1 font-semibold text-xs">Add New Question</label>
          <div className="flex gap-1">
            <input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="w-full p-2 rounded border border-gray-300 text-xs" placeholder="Enter question..." />
            <button onClick={handleAdd} className="bg-green-600 text-white font-bold py-1 px-3 rounded hover:bg-green-700 shadow flex items-center gap-1 text-xs min-w-[40px] h-8">
              <span className="icon icon-xs"><FaSave /></span> Add
            </button>
          </div>
        </div>
  <h3 className="text-base font-semibold mb-1">Questions for {site}</h3>
        <ul className="space-y-2">
          {questions.map((q: any, idx: number) => (
            <li key={q.id} className={"flex items-center gap-2 p-2 rounded transition-colors duration-200 " + (idx % 2 === 0 ? "bg-white" : "bg-gray-50") + " hover:bg-primary-50 shadow-sm text-xs"}>
              {editingId === q.id ? (
                <>
                  <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} className="w-full p-1 rounded border border-gray-300 text-xs" />
                  <select value={editingEmoji} onChange={e => setEditingEmoji(e.target.value)} className="w-16 p-1 rounded border border-gray-300 text-xs">
                    <option value="">Emoji</option>
                    {RATINGS.map(r => (
                      <option key={r.emoji} value={r.emoji}>{r.emoji}</option>
                    ))}
                  </select>
                  <button onClick={() => handleEdit(q.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow text-xs">
                    <span className="icon"><FaSave /></span>
                  </button>
                  <button onClick={() => { setEditingId(null); setEditingText(''); setEditingEmoji(''); }} className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow text-xs">
                    <span className="icon"><FaTimes /></span>
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-gray-800">{q.question_text} {q.emoji && <span className="ml-2 text-xl">{q.emoji}</span>}</span>
                  <button onClick={() => { setEditingId(q.id); setEditingText(q.question_text); setEditingEmoji(q.emoji || ''); }} className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow text-xs">
                    <span className="icon"><FaEdit /></span> Edit
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow text-xs">
                    <span className="icon"><FaTrash /></span> Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </>
    )}
    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
  </div>
  );
};

export default AdminQuestions;
