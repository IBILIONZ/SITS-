import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Student, Course, Result, AcademicSession, Department } from '../types';
import { GraduationCap, Printer, Download, FileText } from 'lucide-react';

const Transcript: React.FC = () => {
  const { user } = useFirebase();
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Get student record
        let studentsSnap = await getDocs(query(collection(db, 'students'), where('userId', '==', user.uid)));
        
        // Fallback: Try searching by email if no record found by UID
        if (studentsSnap.empty && user.email) {
          studentsSnap = await getDocs(query(collection(db, 'students'), where('email', '==', user.email)));
        }

        if (studentsSnap.empty) {
          setLoading(false);
          return;
        }
        const studentData = { id: studentsSnap.docs[0].id, ...studentsSnap.docs[0].data() } as Student;
        setStudent(studentData);

        // 2. Get department
        const deptSnap = await getDocs(collection(db, 'departments'));
        const dept = deptSnap.docs.find(d => d.id === studentData.deptId);
        if (dept) setDepartment({ id: dept.id, ...dept.data() } as Department);

        // 3. Get results, courses, sessions
        const [resultsSnap, coursesSnap, sessionsSnap] = await Promise.all([
          getDocs(query(collection(db, 'results'), where('studentId', '==', studentData.id))),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'academic_sessions')),
        ]);

        setResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result)));
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
        setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession)));
      } catch (error) {
        console.error('Error fetching transcript data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const calculateGPA = (sessionResults: Result[]) => {
    let totalPoints = 0;
    let totalUnits = 0;
    sessionResults.forEach(r => {
      const course = courses.find(c => c.id === r.courseId);
      if (course) {
        totalPoints += r.point * course.units;
        totalUnits += course.units;
      }
    });
    return totalUnits === 0 ? 0 : (totalPoints / totalUnits).toFixed(2);
  };

  const calculateCGPA = () => {
    let totalPoints = 0;
    let totalUnits = 0;
    results.forEach(r => {
      const course = courses.find(c => c.id === r.courseId);
      if (course) {
        totalPoints += r.point * course.units;
        totalUnits += course.units;
      }
    });
    return totalUnits === 0 ? 0 : (totalPoints / totalUnits).toFixed(2);
  };

  const getClassification = (cgpa: number) => {
    if (cgpa >= 3.5) return 'First Class Distinction';
    if (cgpa >= 3.0) return 'Second Class Upper';
    if (cgpa >= 2.0) return 'Second Class Lower';
    if (cgpa >= 1.0) return 'Third Class';
    return 'Fail';
  };

  if (loading) return <div>Loading...</div>;
  if (!student) return <div className="text-center py-12 text-gray-500">No student record found for this user.</div>;

  const cgpa = parseFloat(calculateCGPA() as string);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#2c3e50] print:hidden">
        <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Academic Transcript Generation</h2>
        <p className="text-gray-600 max-w-3xl">
          This module generates the official academic transcript for students. It provides a comprehensive view of academic history, 
          including all courses taken, grades earned, and semester-by-semester GPA. 
          The final CGPA and degree classification are automatically calculated to reflect the student's overall academic standing.
        </p>
      </div>

      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Academic Transcript</h2>
        <button onClick={() => window.print()} className="bg-[#2c3e50] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#34495e]">
          <Printer size={18} className="mr-2" /> Print Transcript
        </button>
      </div>

      <div className="bg-white p-12 shadow-lg border rounded-lg print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center mb-12 border-b pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#2c3e50] p-4 rounded-full">
              <GraduationCap size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#2c3e50] uppercase tracking-wider">ESAE-BENIN University</h1>
          <p className="text-gray-600 font-medium">Official Academic Transcript</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-12 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between border-b py-1"><span className="text-gray-500">Full Name:</span> <span className="font-bold">{student.firstName} {student.lastName}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-gray-500">Matric No:</span> <span className="font-bold">{student.matricNo}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-gray-500">Department:</span> <span className="font-bold">{department?.name}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between border-b py-1"><span className="text-gray-500">Level:</span> <span className="font-bold">{student.level}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-gray-500">Admission Year:</span> <span className="font-bold">{student.admissionYear}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-gray-500">Date Printed:</span> <span className="font-bold">{new Date().toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Results by Session */}
        {results.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-gray-400 mb-4 flex justify-center">
              <FileText size={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-700">No Academic Records Found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              There are currently no examination results recorded for your account in the system.
            </p>
          </div>
        ) : (
          sessions.map(session => {
            const sessionResults = results.filter(r => r.sessionId === session.id);
            if (sessionResults.length === 0) return null;

            return (
              <div key={session.id} className="mb-10">
                <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center text-sm font-bold">
                  <span>{session.name}</span>
                  <span>Session GPA: {calculateGPA(sessionResults)}</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                    <tr>
                      <th className="px-4 py-3 border">Code</th>
                      <th className="px-4 py-3 border">Course Title</th>
                      <th className="px-4 py-3 border text-center">Units</th>
                      <th className="px-4 py-3 border text-center">CA</th>
                      <th className="px-4 py-3 border text-center">Exam</th>
                      <th className="px-4 py-3 border text-center">Total</th>
                      <th className="px-4 py-3 border text-center">Grade</th>
                      <th className="px-4 py-3 border text-center">GP</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sessionResults.map(r => {
                      const course = courses.find(c => c.id === r.courseId);
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-2 border font-medium">{course?.code}</td>
                          <td className="px-4 py-2 border">{course?.title}</td>
                          <td className="px-4 py-2 border text-center">{course?.units}</td>
                          <td className="px-4 py-2 border text-center">{r.caScore}</td>
                          <td className="px-4 py-2 border text-center">{r.examScore}</td>
                          <td className="px-4 py-2 border text-center font-bold">{r.totalScore}</td>
                          <td className="px-4 py-2 border text-center font-bold">{r.grade}</td>
                          <td className="px-4 py-2 border text-center">{r.point.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* Summary Footer */}
        <div className="mt-12 flex justify-end">
          <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded-lg text-center min-w-[250px]">
            <div className="text-4xl font-bold text-[#2c3e50]">{cgpa}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Cumulative GPA (CGPA)</div>
            <div className="text-sm font-bold text-blue-600 mt-2">{getClassification(cgpa)}</div>
          </div>
        </div>

        <div className="mt-16 text-center text-xs text-gray-400 border-t pt-8">
          Generated by SITS ESAE-BENIN University {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Transcript;
