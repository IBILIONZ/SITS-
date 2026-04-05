import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Course, AcademicSession, Enrollment } from '../types';
import { Plus, Search, Trash2, X, BookOpen, User } from 'lucide-react';

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<(Enrollment & { id: string })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    sessionId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, coursesSnap, sessionsSnap, enrollmentsSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), orderBy('matricNo'))),
          getDocs(query(collection(db, 'courses'), orderBy('code'))),
          getDocs(collection(db, 'academic_sessions')),
          getDocs(collection(db, 'enrollments')),
        ]);
        
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
        const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession));
        setSessions(sessionsData);
        setEnrollments(enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment & { id: string })));
        
        const currentSession = sessionsData.find(s => s.current);
        if (currentSession) {
          setSelectedSession(currentSession.id);
          setFormData(prev => ({ ...prev, sessionId: currentSession.id }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.courseId || !formData.sessionId) return;
    
    // Check if already enrolled
    const exists = enrollments.find(e => 
      e.studentId === formData.studentId && 
      e.courseId === formData.courseId && 
      e.sessionId === formData.sessionId
    );
    if (exists) {
      alert('Student is already enrolled in this course for this session.');
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'enrollments'), formData);
      setEnrollments([...enrollments, { id: docRef.id, ...formData }]);
      setIsModalOpen(false);
      setFormData({ ...formData, studentId: '', courseId: '' });
    } catch (error) {
      console.error('Error enrolling student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this enrollment?')) return;
    try {
      await deleteDoc(doc(db, 'enrollments', id));
      setEnrollments(enrollments.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting enrollment:', error);
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    const student = students.find(s => s.id === e.studentId);
    const course = courses.find(c => c.id === e.courseId);
    const matchesSearch = 
      student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.matricNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSession = selectedSession ? e.sessionId === selectedSession : true;
    return matchesSearch && matchesSession;
  });

  if (loading && enrollments.length === 0) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#9b59b6]">
        <h2 className="text-2xl font-bold text-[#9b59b6] mb-2">Course Enrollment Module</h2>
        <p className="text-gray-600 max-w-3xl">
          The Course Enrollment Module is used to register students for specific courses within an academic session. 
          Proper enrollment is a prerequisite for attendance tracking and result computation. 
          Use this interface to manage student-course relationships and ensure all students are correctly registered for their academic requirements.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search enrollments..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="p-2 border rounded-md" 
            value={selectedSession} 
            onChange={e => setSelectedSession(e.target.value)}
          >
            <option value="">All Sessions</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#2c3e50] text-white px-6 py-2 rounded-md flex items-center justify-center hover:bg-[#34495e] transition-colors"
        >
          <Plus size={18} className="mr-2" /> New Enrollment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#2c3e50] text-white text-xs uppercase">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Matric No</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Session</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEnrollments.map((enrollment, index) => {
              const student = students.find(s => s.id === enrollment.studentId);
              const course = courses.find(c => c.id === enrollment.courseId);
              const session = sessions.find(s => s.id === enrollment.sessionId);
              return (
                <tr key={enrollment.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{student?.firstName} {student?.lastName}</td>
                  <td className="px-6 py-4 text-blue-600 font-mono">{student?.matricNo}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{course?.code}</div>
                    <div className="text-xs text-gray-500">{course?.title}</div>
                  </td>
                  <td className="px-6 py-4 text-xs">{session?.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(enrollment.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredEnrollments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No enrollment records found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Enrollment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#2c3e50] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">New Course Enrollment</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <User size={16} className="mr-2" /> Student *
                </label>
                <select 
                  required 
                  className="w-full p-2 border rounded-md" 
                  value={formData.studentId} 
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.matricNo} - {s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <BookOpen size={16} className="mr-2" /> Course *
                </label>
                <select 
                  required 
                  className="w-full p-2 border rounded-md" 
                  value={formData.courseId} 
                  onChange={e => setFormData({...formData, courseId: e.target.value})}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Academic Session *</label>
                <select 
                  required 
                  className="w-full p-2 border rounded-md" 
                  value={formData.sessionId} 
                  onChange={e => setFormData({...formData, sessionId: e.target.value})}
                >
                  <option value="">Select Session</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.current ? '(Current)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#34495e] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
