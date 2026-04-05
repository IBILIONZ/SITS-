import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Department } from '../types';
import { Plus, Search, X, Edit, Trash2, Building2 } from 'lucide-react';

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<(Department & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<(Department & { id: string }) | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'departments'), orderBy('name')));
        setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department & { id: string })));
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleOpenModal = (dept?: Department & { id: string }) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name });
    } else {
      setEditingDept(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDept) {
        await updateDoc(doc(db, 'departments', editingDept.id), formData);
        setDepartments(departments.map(d => d.id === editingDept.id ? { ...d, ...formData } : d));
      } else {
        const docRef = await addDoc(collection(db, 'departments'), formData);
        setDepartments([...departments, { id: docRef.id, ...formData }]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This may affect courses and students.')) return;
    try {
      await deleteDoc(doc(db, 'departments', id));
      setDepartments(departments.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#8e44ad]">
        <h2 className="text-2xl font-bold text-[#8e44ad] mb-2">Department Management</h2>
        <p className="text-gray-600 max-w-3xl">
          Manage the academic departments of the university. Each department serves as a container for courses and students. 
          Accurate department records are essential for organizational structure and reporting.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search departments..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#2c3e50] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#34495e] transition-colors"
        >
          <Plus size={18} className="mr-2" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <button 
                onClick={() => handleOpenModal(dept)}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => handleDelete(dept.id)}
                className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{dept.name}</h3>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Academic Unit</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#2c3e50] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Department Name</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  value={formData.name} 
                  onChange={e => setFormData({ name: e.target.value })} 
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#34495e] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
