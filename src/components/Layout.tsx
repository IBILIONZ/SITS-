import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  FileText, 
  GraduationCap, 
  UserCheck,
  User,
  Building2,
  Calendar,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'lecturer', 'student'] },
    { name: 'Students', path: '/students', icon: Users, roles: ['admin'] },
    { name: 'Lecturers', path: '/lecturers', icon: UserCheck, roles: ['admin'] },
    { name: 'Departments', path: '/departments', icon: Building2, roles: ['admin'] },
    { name: 'Sessions', path: '/sessions', icon: Calendar, roles: ['admin'] },
    { name: 'Enrollments', path: '/enrollments', icon: ClipboardCheck, roles: ['admin'] },
    { name: 'Courses', path: '/courses', icon: BookOpen, roles: ['admin'] },
    { name: 'Attendance', path: '/attendance', icon: ClipboardCheck, roles: ['admin', 'lecturer'] },
    { name: 'Results Entry', path: '/results', icon: FileText, roles: ['admin', 'lecturer'] },
    { name: 'Transcript', path: '/transcript', icon: GraduationCap, roles: ['admin', 'student'] },
    { name: 'Profile', path: '/profile', icon: User, roles: ['admin', 'lecturer', 'student'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`bg-[#2c3e50] text-white w-64 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`font-bold text-xl ${!isSidebarOpen && 'lg:hidden'}`}>SITS</div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>
        
        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {isSidebarOpen ? 'Main Menu' : '...'}
        </div>

        <nav className="mt-4 space-y-1 px-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path 
                  ? 'bg-[#34495e] text-white' 
                  : 'text-gray-300 hover:bg-[#34495e] hover:text-white'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${!isSidebarOpen && 'lg:mr-0'}`} />
              <span className={`${!isSidebarOpen && 'lg:hidden'}`}>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center mr-3">
              {user?.displayName?.[0]}
            </div>
            <div className={`${!isSidebarOpen && 'lg:hidden'}`}>
              <div className="text-sm font-medium">{user?.displayName}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#34495e] hover:text-white rounded-md transition-colors"
          >
            <LogOut className={`mr-3 h-5 w-5 ${!isSidebarOpen && 'lg:mr-0'}`} />
            <span className={`${!isSidebarOpen && 'lg:hidden'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-bottom h-16 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-4 lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
