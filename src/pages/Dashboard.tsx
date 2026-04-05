import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Student, Course, Department, User } from '../types';
import { 
  Users, 
  BookOpen, 
  Building2, 
  UserCheck, 
  ArrowRight,
  TrendingUp,
  GraduationCap,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useFirebase();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalLecturers: 0,
    totalDepartments: 0,
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsSnap, coursesSnap, usersSnap, deptsSnap, enrollmentsSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'enrollments')),
        ]);

        const lecturersCount = usersSnap.docs.filter(doc => doc.data().role === 'lecturer').length;

        setStats({
          totalStudents: studentsSnap.size,
          totalCourses: coursesSnap.size,
          totalLecturers: lecturersCount,
          totalDepartments: deptsSnap.size,
        });

        // Recent students
        const recentQuery = query(collection(db, 'students'), orderBy('matricNo', 'desc'), limit(6));
        const recentSnap = await getDocs(recentQuery);
        setRecentStudents(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));

        // Dept data for chart
        const depts = deptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        const chartData = depts.map(dept => ({
          name: dept.name,
          count: studentsSnap.docs.filter(doc => doc.data().deptId === dept.id).length
        }));
        setDeptData(chartData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const COLORS = ['#3498db', '#1abc9c', '#e67e22', '#9b59b6', '#34495e'];

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#2c3e50] to-[#34495e] p-10 rounded-2xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">Welcome back, {user?.displayName}!</h1>
          <p className="text-blue-100 text-lg max-w-2xl opacity-90">
            ESAE-BENIN University Student Information Tracing System (SITS). 
            Manage students, courses, attendance, and results from this central dashboard.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <GraduationCap size={200} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-4 rounded-lg text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-green-50 p-4 rounded-lg text-green-600">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Courses</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-purple-50 p-4 rounded-lg text-purple-600">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Lecturers</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalLecturers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="bg-orange-50 p-4 rounded-lg text-orange-600">
            <Building2 size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Departments</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalDepartments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center">
            <BarChart3 size={20} className="mr-2 text-blue-600" /> Student Distribution by Department
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="count" fill="#2c3e50" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Students Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Users size={20} className="mr-2 text-blue-600" /> Recent Registrations
          </h3>
          <div className="space-y-5">
            {recentStudents.map((student) => (
              <div key={student.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-gray-500 font-mono">{student.matricNo}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                    {student.level}
                  </span>
                </div>
              </div>
            ))}
            <button 
              onClick={() => navigate('/students')}
              className="w-full mt-4 py-3 text-sm font-bold text-blue-600 hover:text-blue-700 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all"
            >
              View All Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
