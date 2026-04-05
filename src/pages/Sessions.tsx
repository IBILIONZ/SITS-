import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { AcademicSession } from '../types';
import { Plus, Search, X, Edit, Trash2, Calendar, CheckCircle } from 'lucide-react';

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<(AcademicSession & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<(AcademicSession & { id: string }) | null>(null);
  const [formData, setFormData] = useState({ name: '', current: false });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'academic_sessions'), orderBy('name', 'desc')));
        setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession & { id: string })));
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleOpenModal = (session?: AcademicSession & { id: string }) => {
    if (session) {
      setEditingSession(session);
      setFormData({ name: session.name, current: session.current });
    } else {
      setEditingSession(null);
      setFormData({ name: '', current: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // If setting this session as current, unset others
      if (formData.current) {
        sessions.forEach(s => {
          if (s.current && (!editingSession || s.id !== editingSession.id)) {
            batch.update(doc(db, 'academic_sessions', s.id), { current: false });
          }
        });
      }

      if (editingSession) {
        batch.update(doc(db, 'academic_sessions', editingSession.id), formData);
        await batch.commit();
        setSessions(sessions.map(s => {
          if (formData.current && s.current && s.id !== editingSession.id) return { ...s, current: false };
          if (s.id === editingSession.id) return { ...s, ...formData };
          return s;
        }));
      } else {
        const docRef = await addDoc(collection(db, 'academic_sessions'), formData);
        if (formData.current) await batch.commit();
        setSessions(prev => {
          const updated = prev.map(s => formData.current ? { ...s, current: false } : s);
          return [{ id: docRef.id, ...formData }, ...updated];
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteDoc(doc(db, 'academic_sessions', id));
      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#e67e22]">
        <h2 className="text-2xl font-bold text-[#e67e22] mb-2">Academic Session Management</h2>
        <p className="text-gray-600 max-w-3xl">
          Define and manage university academic sessions and semesters. 
          Marking a session as "Current" will set it as the default for enrollment, attendance, and results entry throughout the system.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search sessions..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#2c3e50] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#34495e] transition-colors"
        >
          <Plus size={18} className="mr-2" /> Add Session
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#2c3e50] text-white text-xs uppercase">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Session Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSessions.map((session, index) => (
              <tr key={session.id} className="hover:bg-gray-50 text-sm">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4 font-medium">{session.name}</td>
                <td className="px-6 py-4">
                  {session.current ? (
                    <span className="flex items-center text-green-600 font-semibold">
                      <CheckCircle size={16} className="mr-1" /> Current Active
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => handleOpenModal(session)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(session.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#2c3e50] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingSession ? 'Edit Session' : 'Add Session'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Session Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g., 2024/2025 First Semester"
                  className="w-full p-2 border rounded-md" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="current"
                  checked={formData.current} 
                  onChange={e => setFormData({ ...formData, current: e.target.checked })} 
                />
                <label htmlFor="current" className="text-sm font-medium text-gray-700">Set as Current Active Session</label>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#34495e] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
