import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { User as UserType, Student } from '../types';
import { User, Mail, Shield, GraduationCap, Building2, Save, CheckCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useFirebase();
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setDisplayName(user.displayName);
        if (user.role === 'student') {
          // Try to find student record
          const snap = await getDoc(doc(db, 'students', user.uid)); // This assumes studentId is same as uid, which might not be true
          // Better: query by email or userId
          // For now, let's just use the user object
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-[#34495e]">
        <h2 className="text-2xl font-bold text-[#34495e] mb-2">User Profile</h2>
        <p className="text-gray-600">
          Manage your personal information and account settings. Keep your profile details up to date to ensure accurate communication and academic records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-gray-500">
              {user?.displayName?.[0]}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{user?.displayName}</h3>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            <div className="mt-4 inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              Active Account
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Account Details</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail size={16} className="mr-3 text-gray-400" />
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Shield size={16} className="mr-3 text-gray-400" />
                <span className="text-gray-600 capitalize">{user?.role} Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <User size={20} className="mr-2 text-blue-600" /> Personal Information
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address (Read-only)</label>
                <input 
                  type="email" 
                  disabled 
                  className="w-full p-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" 
                  value={user?.email} 
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#2c3e50] text-white px-8 py-2 rounded-md hover:bg-[#34495e] transition-colors flex items-center disabled:opacity-50"
                >
                  <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {success && (
                  <span className="text-green-600 flex items-center text-sm font-medium animate-fade-in">
                    <CheckCircle size={16} className="mr-1" /> Profile updated successfully!
                  </span>
                )}
              </div>
            </div>
          </div>

          {user?.role === 'student' && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <GraduationCap size={20} className="mr-2 text-blue-600" /> Academic Information
              </h4>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-gray-500">Matriculation Number</div>
                  <div className="font-medium text-gray-800">ESAE/CS/2024/001</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-500">Department</div>
                  <div className="font-medium text-gray-800">Computer Science</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-500">Current Level</div>
                  <div className="font-medium text-gray-800">100L</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-500">Admission Year</div>
                  <div className="font-medium text-gray-800">2024</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
