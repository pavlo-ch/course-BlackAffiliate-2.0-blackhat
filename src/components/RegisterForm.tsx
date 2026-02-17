'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle, User, Building2, AlertCircle, FileText, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PolicyModal from './PolicyModal';

export default function RegisterForm() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!acceptedPolicy) {
      setError('Please accept the usage policy');
      return;
    }

    if (formData.password.length < 5) {
      setError('Password must be at least 5 characters long');
      return;
    }

    setShowDeviceWarning(true);
  };

  const handleConfirmRegistration = async () => {
    setShowDeviceWarning(false);
    setIsLoading(true);

    try {
      const result = await register(formData);
      
      if (result.success) {
        setIsRegistered(true);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('Registration error. Please try again.');
    }

    setIsLoading(false);
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-[#0f1012] rounded-lg p-8 text-center">
            <div className="bg-green-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Request Sent!
            </h2>
            <p className="text-gray-300 mb-6">
              Your registration request has been sent to the administrator. You will get access to the course after approval.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Your email:</p>
              <p className="text-white font-medium">{formData.email}</p>
            </div>
            <p className="text-sm text-gray-400">
              The administrator has been notified via Telegram and will review your request shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Registration</h1>
          <p className="text-gray-400">Create an account to access the training</p>
        </div>

        <div className="bg-[#0f1012] rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company Name <span className="text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  minLength={5}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => setAcceptedPolicy(!acceptedPolicy)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  acceptedPolicy
                    ? 'bg-red-600 border-red-600'
                    : 'bg-gray-800 border-gray-600 group-hover:border-gray-500'
                }`}
              >
                {acceptedPolicy && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <span className="text-sm text-gray-300">
                I have read and accept the{' '}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsPolicyModalOpen(true); }}
                  className="text-primary hover:text-red-400 underline inline-flex items-center gap-1 transition-colors"
                >
                  platform usage policy
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </span>
            </label>

            {error && (
              <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <a href="/" className="text-primary hover:text-red-400 transition-colors">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>

      <PolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />

      {showDeviceWarning && (
        <div className="fixed inset-0 bg-black flex items-center justify-center px-4 z-50">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-yellow-500/10 rounded-full p-4">
                <AlertCircle className="w-14 h-14 text-yellow-500" strokeWidth={2} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Important Notice
            </h2>
            
            <div className="mb-8 space-y-4">
              <p className="text-gray-300 text-base leading-relaxed text-center">
                Your account will be <span className="font-semibold text-yellow-400">permanently linked to this device</span>.
              </p>
              
              <p className="text-gray-400 text-sm text-center">
                Make sure you are registering from your main device that you plan to use regularly.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeviceWarning(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegistration}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Continue</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}