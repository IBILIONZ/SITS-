import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Student, Department } from '../types';
import { Plus, Search, Eye, ToggleLeft, ToggleRight, X, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../lib/utils';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricNo: '',
    gender: 'Male' as 'Male' | 'Female',
    deptId: '',
    level: '100L',
    admissionYear: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, deptsSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), orderBy('matricNo'))),
          getDocs(collection(db, 'departments')),
        ]);
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
        setDepartments(deptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        matricNo: student.matricNo,
        gender: student.gender,
        deptId: student.deptId,
        level: student.level,
        admissionYear: student.admissionYear,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        matricNo: '',
        gender: 'Male',
        deptId: '',
        level: '100L',
        admissionYear: new Date().getFullYear().toString(),
      });
    }
    setIsModalOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), formData);
        setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...formData } : s));
      } else {
        const studentData = {
          ...formData,
          userId: 'temp-uid-' + Math.random().toString(36).substr(2, 9),
          status: 'Active' as const,
        };
        const docRef = await addDoc(collection(db, 'students'), studentData);
        setStudents([...students, { id: docRef.id, ...studentData }]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(students.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const toggleStatus = async (student: Student) => {
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateDoc(doc(db, 'students', student.id), { status: newStatus });
      setStudents(students.map(s => s.id === student.id ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matricNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#2c3e50]">
        <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Student Management Module</h2>
        <p className="text-gray-600 max-w-3xl">
          Welcome to the Student Management Module. This central hub allows administrators to maintain comprehensive records of all students enrolled at ESAE-BENIN University. 
          You can register new students, update existing profiles, and manage account statuses. Use the search functionality to quickly locate specific student records by name or matriculation number.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV(filteredStudents, 'students_list')}
            className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 transition-colors"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#2c3e50] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#34495e] transition-colors"
          >
            <Plus size={18} className="mr-2" /> Register Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#2c3e50] text-white text-xs uppercase">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Matric No</th>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Dept</th>
              <th className="px-6 py-4">Level</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student, index) => (
              <tr key={student.id} className="hover:bg-gray-50 text-sm">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-blue-600">{student.matricNo}</td>
                <td className="px-6 py-4">{student.firstName} {student.lastName}</td>
                <td className="px-6 py-4">{departments.find(d => d.id === student.deptId)?.name || 'N/A'}</td>
                <td className="px-6 py-4">{student.level}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => handleOpenModal(student)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit Student"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => toggleStatus(student)}
                    className={`p-2 rounded-full transition-colors ${student.status === 'Active' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                    title={student.status === 'Active' ? 'Deactivate' : 'Activate'}
                  >
                    {student.status === 'Active' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Student"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#2c3e50] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingStudent ? 'Edit Student Record' : 'Register New Student'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleRegister} className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input required type="email" className="w-full p-2 border rounded-md" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Matric Number</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.matricNo} onChange={e => setFormData({...formData, matricNo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select className="w-full p-2 border rounded-md" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'Male' | 'Female'})}>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Department</label>
                <select required className="w-full p-2 border rounded-md" value={formData.deptId} onChange={e => setFormData({...formData, deptId: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Level</label>
                <select className="w-full p-2 border rounded-md" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                  <option>100L</option>
                  <option>200L</option>
                  <option>300L</option>
                  <option>400L</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Admission Year</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.admissionYear} onChange={e => setFormData({...formData, admissionYear: e.target.value})} />
              </div>
              <div className="col-span-2 mt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#34495e] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
