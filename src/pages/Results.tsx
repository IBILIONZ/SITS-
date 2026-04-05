import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Course, Student, Result, AcademicSession } from '../types';
import { FileText, Save, Calculator } from 'lucide-react';

const Results: React.FC = () => {
  const { user } = useFirebase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [resultsData, setResultsData] = useState<Record<string, { ca: number, exam: number }>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesSnap, sessionsSnap] = await Promise.all([
          getDocs(user?.role === 'admin' ? collection(db, 'courses') : query(collection(db, 'courses'), where('lecturerId', '==', user?.uid))),
          getDocs(collection(db, 'academic_sessions')),
        ]);
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
        const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession));
        setSessions(sessionsData);
        const currentSession = sessionsData.find(s => s.current);
        if (currentSession) setSelectedSession(currentSession.id);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleLoadStudents = async () => {
    if (!selectedCourse || !selectedSession) return;
    setLoading(true);
    try {
      // 1. Get enrollments
      const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', selectedCourse), where('sessionId', '==', selectedSession)));
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

      // 3. Get existing results
      const resultsSnap = await getDocs(query(collection(db, 'results'), where('courseId', '==', selectedCourse), where('sessionId', '==', selectedSession)));
      const existingData: Record<string, { ca: number, exam: number }> = {};
      resultsSnap.docs.forEach(doc => {
        const data = doc.data() as Result;
        existingData[data.studentId] = { ca: data.caScore, exam: data.examScore };
      });

      const initialData = { ...existingData };
      enrolledStudents.forEach(s => {
        if (!initialData[s.id]) initialData[s.id] = { ca: 0, exam: 0 };
      });
      setResultsData(initialData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const computeGrade = (total: number) => {
    if (total >= 70) return { grade: 'A', point: 4.0 };
    if (total >= 60) return { grade: 'B', point: 3.0 };
    if (total >= 50) return { grade: 'C', point: 2.0 };
    if (total >= 45) return { grade: 'D', point: 1.0 };
    return { grade: 'F', point: 0.0 };
  };

  const handleScoreChange = (studentId: string, field: 'ca' | 'exam', value: string) => {
    const numValue = Math.min(field === 'ca' ? 30 : 70, Math.max(0, parseInt(value) || 0));
    const currentScores = resultsData[studentId] || { ca: 0, exam: 0 };
    setResultsData({
      ...resultsData,
      [studentId]: { ...currentScores, [field]: numValue }
    });
  };

  const handleSaveResults = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(resultsData).map(async ([studentId, scores]) => {
        const s = scores as { ca: number, exam: number };
        const total = s.ca + s.exam;
        const { grade, point } = computeGrade(total);
        const resultId = `${selectedCourse}_${studentId}_${selectedSession}`;
        await setDoc(doc(db, 'results', resultId), {
          studentId,
          courseId: selectedCourse,
          sessionId: selectedSession,
          caScore: s.ca,
          examScore: s.exam,
          totalScore: total,
          grade,
          point
        });
      });
      await Promise.all(promises);
      alert('Results saved successfully!');
    } catch (error) {
      console.error('Error saving results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#d35400]">
        <h2 className="text-2xl font-bold text-[#d35400] mb-2">Result Entry & Grade Computation</h2>
        <p className="text-gray-600 max-w-3xl">
          The Result Entry Module facilitates the accurate recording of student academic performance. 
          Lecturers can enter Continuous Assessment (CA) and Examination scores for their respective courses. 
          The system automatically computes total scores and assigns letter grades based on the university's official grading scale.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Course *</label>
          <select className="w-full p-2 border rounded-md" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Academic Session *</label>
          <select className="w-full p-2 border rounded-md" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={handleLoadStudents} disabled={!selectedCourse || loading} className="bg-[#2c3e50] text-white py-2 px-6 rounded-md hover:bg-[#34495e] disabled:opacity-50">
          {loading ? 'Loading...' : 'Load Students'}
        </button>
      </div>

      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Results Entry: {students.length} Students</h3>
            <div className="text-xs text-gray-500">CA: max 30 | Exam: max 70 | Total: 100</div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#2c3e50] text-white text-xs uppercase">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Matric No</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4 text-center">CA /30</th>
                <th className="px-6 py-4 text-center">Exam /70</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student, index) => {
                const scores = (resultsData[student.id] as { ca: number, exam: number }) || { ca: 0, exam: 0 };
                const total = scores.ca + scores.exam;
                const { grade } = computeGrade(total);
                return (
                  <tr key={student.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 font-medium">{student.matricNo}</td>
                    <td className="px-6 py-4">{student.firstName} {student.lastName}</td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        className="w-16 p-1 border rounded text-center" 
                        value={scores.ca} 
                        onChange={e => handleScoreChange(student.id, 'ca', e.target.value)} 
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        className="w-16 p-1 border rounded text-center" 
                        value={scores.exam} 
                        onChange={e => handleScoreChange(student.id, 'exam', e.target.value)} 
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{total}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                        grade === 'A' ? 'bg-green-600' : 
                        grade === 'B' ? 'bg-blue-600' : 
                        grade === 'C' ? 'bg-yellow-500' : 
                        grade === 'D' ? 'bg-orange-500' : 'bg-red-600'
                      }`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-6 bg-gray-50 border-t flex justify-center">
            <button onClick={handleSaveResults} disabled={loading} className="bg-[#2c3e50] text-white py-2 px-12 rounded-md hover:bg-[#34495e] disabled:opacity-50 flex items-center">
              <Save size={18} className="mr-2" /> {loading ? 'Saving...' : 'Save All Results'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
