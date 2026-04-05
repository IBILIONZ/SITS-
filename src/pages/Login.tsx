import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { GraduationCap } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2c3e50] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-[#2c3e50] p-4 rounded-full">
            <GraduationCap size={48} className="text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">SITS</h1>
        <p className="text-gray-600 mb-8">Student Information Tracing System<br />ESAE-BENIN University</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-[#2c3e50] text-white py-3 px-4 rounded-md font-semibold hover:bg-[#34495e] transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
              Sign In with Google
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-gray-400">
          2024 ESAE-BENIN University All rights reserved
        </p>
      </div>
    </div>
  );
};

export default Login;
