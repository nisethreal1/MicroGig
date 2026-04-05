import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout, signInWithGoogle, auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../firebase';
import { LogIn, LogOut, User as UserIcon, PlusCircle, MessageSquare, ShoppingBag, LayoutDashboard, Phone, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [showPhoneLogin, setShowPhoneLogin] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [step, setStep] = React.useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = React.useState(false);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha resolved');
        }
      });
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep('code');
    } catch (error: any) {
      setLoginError(error.message);
      console.error('Phone sign in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setLoginError(null);
    try {
      await confirmationResult.confirm(verificationCode);
      setShowPhoneLogin(false);
      setStep('phone');
      setPhoneNumber('');
      setVerificationCode('');
      setConfirmationResult(null);
    } catch (error: any) {
      setLoginError(error.message);
      console.error('Code verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      // Ignore cancellation errors
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      
      if (error.code === 'auth/network-request-failed') {
        setLoginError('Network error. Please try opening the app in a new tab.');
      } else {
        setLoginError(`Login failed: ${error.message || 'Unknown error'}`);
      }
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
              MicroGig
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Browse</Link>
            <Link to="/sellers" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Sellers</Link>
            {user && (
              <>
                <Link to="/messages" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <MessageSquare size={18} />
                  Messages
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <ShoppingBag size={18} />
                  Orders
                </Link>
                <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {loginError && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-red-500 font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                {loginError}
                <button 
                  onClick={handleLogin}
                  className="underline hover:text-red-700 ml-2"
                >
                  Retry
                </button>
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="underline hover:text-red-700 ml-2"
                >
                  Try in new tab
                </button>
              </div>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                {profile?.role !== 'buyer' && (
                  <Link
                    to="/services/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    Post a Gig
                  </Link>
                )}
                <div className="relative group">
                  <img
                    src={profile?.photoURL || user.photoURL || 'https://via.placeholder.com/40'}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-indigo-600 transition-all cursor-pointer"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">My Profile</Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPhoneLogin(true)}
                  className="hidden sm:flex items-center gap-2 text-gray-700 font-medium hover:text-indigo-600 transition-colors"
                >
                  <Phone size={18} />
                  Phone Login
                </button>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center gap-2 text-gray-700 font-medium hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  <LogIn size={20} />
                  {isLoggingIn ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="recaptcha-container"></div>

      {/* Phone Login Modal */}
      <AnimatePresence>
        {showPhoneLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhoneLogin(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full"
            >
              <button
                onClick={() => setShowPhoneLogin(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  <Phone size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Phone Login</h3>
                <p className="text-gray-500 font-medium">
                  {step === 'phone' ? 'Enter your phone number to continue' : 'Enter the 6-digit code sent to your phone'}
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
                  {loginError}
                </div>
              )}

              {step === 'phone' ? (
                <form onSubmit={handlePhoneSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+855 12 345 678"
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verification Code</label>
                    <input
                      type="text"
                      placeholder="123456"
                      required
                      maxLength={6}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-center text-2xl tracking-[1em]"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-gray-500 font-bold text-sm hover:underline"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
};
