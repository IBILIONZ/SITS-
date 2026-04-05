import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Course, Student, Enrollment, Attendance } from '../types';
import { Calendar, Check, X, Minus } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { user } = useFirebase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'Present' | 'Absent' | 'Excused'>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesSnap = await getDocs(
          user?.role === 'admin' 
            ? collection(db, 'courses') 
            : query(collection(db, 'courses'), where('lecturerId', '==', user?.uid))
        );
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    if (user) fetchCourses();
  }, [user]);

  const handleLoadStudents = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      // 1. Get enrollments for this course
      const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', selectedCourse)));
      const studentIds = enrollmentsSnap.docs.map(doc => doc.data().studentId);
      
      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 2. Get students
      const studentsSnap = await getDocs(collection(db, 'students'));
      const enrolledStudents = studentsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Student))
        .filter(s => studentIds.includes(s.id));
      
      setStudents(enrolledStudents);

      // 3. Get existing attendance for this date
      const attendanceSnap = await getDocs(query(
        collection(db, 'attendance'), 
        where('courseId', '==', selectedCourse),
        where('date', '==', sessionDate)
      ));
      
      const existingData: Record<string, 'Present' | 'Absent' | 'Excused'> = {};
      attendanceSnap.docs.forEach(doc => {
        const data = doc.data() as Attendance;
        existingData[data.studentId] = data.status;
      });

      // Default to Present for those without records
      const initialData = { ...existingData };
      enrolledStudents.forEach(s => {
        if (!initialData[s.id]) initialData[s.id] = 'Present';
      });
      
      setAttendanceData(initialData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Excused') => {
    setAttendanceData({ ...attendanceData, [studentId]: status });
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(attendanceData).map(async ([studentId, status]) => {
        const attendanceId = `${selectedCourse}_${studentId}_${sessionDate}`;
        await setDoc(doc(db, 'attendance', attendanceId), {
          courseId: selectedCourse,
          studentId,
          date: sessionDate,
          status
        });
      });
      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#2c3e50]">
        <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Attendance Tracking Module</h2>
        <p className="text-gray-600 max-w-3xl">
          Welcome to the Attendance Tracking Module. This tool enables lecturers to efficiently record student presence for every lecture session. 
          Regular attendance tracking is vital for monitoring student engagement and ensuring compliance with university academic policies. 
          Select your course and session date to begin marking attendance.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Course *</label>
          <select 
            className="w-full p-2 border rounded-md" 
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Session Date *</label>
          <input 
            type="date" 
            className="w-full p-2 border rounded-md" 
            value={sessionDate} 
            onChange={e => setSessionDate(e.target.value)} 
          />
        </div>
        <button 
          onClick={handleLoadStudents}
          disabled={!selectedCourse || loading}
          className="bg-[#2c3e50] text-white py-2 px-6 rounded-md hover:bg-[#34495e] disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Students'}
        </button>
      </div>

      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Mark Attendance: {students.length} Students</h3>
            <div className="space-x-2">
              <button 
                onClick={() => {
                  const allPresent = { ...attendanceData };
                  students.forEach(s => allPresent[s.id] = 'Present');
                  setAttendanceData(allPresent);
                }}
                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                All Present
              </button>
              <button 
                onClick={() => {
                  const allAbsent = { ...attendanceData };
                  students.forEach(s => allAbsent[s.id] = 'Absent');
                  setAttendanceData(allAbsent);
                }}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                All Absent
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#2c3e50] text-white text-xs uppercase">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Matric No</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{student.matricNo}</td>
                  <td className="px-6 py-4">{student.firstName} {student.lastName}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-1">
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Present')}
                        className={`flex items-center px-3 py-1 rounded-l-md border text-xs font-medium transition-colors ${attendanceData[student.id] === 'Present' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Absent')}
                        className={`flex items-center px-3 py-1 border-t border-b text-xs font-medium transition-colors ${attendanceData[student.id] === 'Absent' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        Absent
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, 'Excused')}
                        className={`flex items-center px-3 py-1 rounded-r-md border text-xs font-medium transition-colors ${attendanceData[student.id] === 'Excused' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        Excused
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-gray-50 border-t flex justify-center">
            <button 
              onClick={handleSaveAttendance}
              disabled={loading}
              className="bg-[#2c3e50] text-white py-2 px-12 rounded-md hover:bg-[#34495e] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
