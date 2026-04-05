import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Department } from '../types';
import { Plus, Search, X, UserCheck, Mail, Shield, Edit, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../lib/utils';

const Lecturers: React.FC = () => {
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'lecturer')));
        setLecturers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      } catch (error) {
        console.error('Error fetching lecturers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLecturers();
  }, []);

  const handleOpenModal = (lecturer?: User) => {
    if (lecturer) {
      setEditingLecturer(lecturer);
      setFormData({
        displayName: lecturer.displayName,
        email: lecturer.email,
      });
    } else {
      setEditingLecturer(null);
      setFormData({ displayName: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleAddLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingLecturer) {
        await updateDoc(doc(db, 'users', editingLecturer.uid), formData);
        setLecturers(lecturers.map(l => l.uid === editingLecturer.uid ? { ...l, ...formData } : l));
      } else {
        const uid = 'lecturer-' + Math.random().toString(36).substr(2, 9);
        const newUser: User = {
          uid,
          email: formData.email,
          displayName: formData.displayName,
          role: 'lecturer',
        };
        await setDoc(doc(db, 'users', uid), newUser);
        setLecturers([...lecturers, newUser]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving lecturer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this lecturer?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setLecturers(lecturers.filter(l => l.uid !== uid));
    } catch (error) {
      console.error('Error deleting lecturer:', error);
    }
  };

  const filteredLecturers = lecturers.filter(l => 
    l.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#3498db]">
        <h2 className="text-2xl font-bold text-[#3498db] mb-2">Lecturer Management Module</h2>
        <p className="text-gray-600 max-w-3xl">
          Manage the university's academic staff here. You can register new lecturers, update their profiles, and assign them to various courses. 
          Accurate lecturer records are essential for course assignments and attendance tracking.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search lecturers..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV(filteredLecturers, 'lecturers_list')}
            className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 transition-colors"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#2c3e50] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#34495e] transition-colors"
          >
            <Plus size={18} className="mr-2" /> Add Lecturer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLecturers.map((lecturer) => (
          <div key={lecturer.uid} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <button 
                onClick={() => handleOpenModal(lecturer)}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleDelete(lecturer.uid)}
                className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{lecturer.displayName}</h3>
                <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Academic Staff</div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-gray-400" />
                {lecturer.email}
              </div>
              <div className="flex items-center">
                <Shield size={16} className="mr-2 text-gray-400" />
                Role: <span className="ml-1 capitalize font-medium text-gray-800">{lecturer.role}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button className="text-sm text-blue-600 font-medium hover:underline">View Courses</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#2c3e50] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Add New Lecturer</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddLecturer} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input required type="email" className="w-full p-2 border rounded-md" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#34495e] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Add Lecturer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lecturers;
