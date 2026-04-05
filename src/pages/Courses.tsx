import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, Department, User } from '../types';
import { Plus, Search, X, Edit, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../lib/utils';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    units: 3,
    deptId: '',
    level: '100L',
    lecturerId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesSnap, deptsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'courses'), orderBy('code'))),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'users')),
        ]);
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
        setDepartments(deptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
        setLecturers(usersSnap.docs.filter(doc => doc.data().role === 'lecturer').map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        code: course.code,
        title: course.title,
        units: course.units,
        deptId: course.deptId,
        level: course.level,
        lecturerId: course.lecturerId,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        code: '',
        title: '',
        units: 3,
        deptId: '',
        level: '100L',
        lecturerId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), formData);
        setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...formData } : c));
      } else {
        const docRef = await addDoc(collection(db, 'courses'), formData);
        setCourses([...courses, { id: docRef.id, ...formData } as Course]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#16a085]">
        <h2 className="text-2xl font-bold text-[#16a085] mb-2">Course Management Module</h2>
        <p className="text-gray-600 max-w-3xl">
          The Course Management Module is designed to help administrators organize the university's academic curriculum. 
          Here, you can define new courses, specify credit units, and assign qualified lecturers to each course. 
          Maintaining an accurate course catalog is essential for student enrollment and academic tracking.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV(filteredCourses, 'courses_list')}
            className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 transition-colors"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#2c3e50] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#34495e] transition-colors"
          >
            <Plus size={18} className="mr-2" /> Add Course
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#2c3e50] text-white text-xs uppercase">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Course Title</th>
              <th className="px-6 py-4">Units</th>
              <th className="px-6 py-4">Dept</th>
              <th className="px-6 py-4">Level</th>
              <th className="px-6 py-4">Lecturer</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourses.map((course, index) => (
              <tr key={course.id} className="hover:bg-gray-50 text-sm">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-blue-600">{course.code}</td>
                <td className="px-6 py-4">{course.title}</td>
                <td className="px-6 py-4">{course.units}</td>
                <td className="px-6 py-4">{departments.find(d => d.id === course.deptId)?.name || 'N/A'}</td>
                <td className="px-6 py-4">{course.level}</td>
                <td className="px-6 py-4">{lecturers.find(l => l.uid === course.lecturerId)?.displayName || 'Unassigned'}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => handleOpenModal(course)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(course.id)}
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#2c3e50] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Course Code</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Course Title</label>
                <input required type="text" className="w-full p-2 border rounded-md" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Units</label>
                  <input required type="number" className="w-full p-2 border rounded-md" value={formData.units} onChange={e => setFormData({...formData, units: parseInt(e.target.value)})} />
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Department</label>
                <select required className="w-full p-2 border rounded-md" value={formData.deptId} onChange={e => setFormData({...formData, deptId: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lecturer</label>
                <select required className="w-full p-2 border rounded-md" value={formData.lecturerId} onChange={e => setFormData({...formData, lecturerId: e.target.value})}>
                  <option value="">Select Lecturer</option>
                  {lecturers.map(l => <option key={l.uid} value={l.uid}>{l.displayName}</option>)}
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#34495e] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
