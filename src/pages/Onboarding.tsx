import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, updateProfile } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, Camera, Loader2, CheckCircle, ShoppingBag, Briefcase, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Onboarding: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.phoneNumber || '',
    role: 'buyer',
    photoURL: user?.photoURL || '',
    bio: '',
  });

  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (profile) return <Navigate to="/dashboard" />;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // DO NOT updateProfile(user, { photoURL: base64String }) as it exceeds length limits
        setFormData(prev => ({ ...prev, photoURL: base64String }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const newProfile = {
        uid: user.uid,
        displayName: formData.displayName,
        email: user.email || '',
        photoURL: formData.photoURL,
        role: formData.role,
        bio: formData.bio,
        skills: [],
        createdAt: new Date().toISOString(),
      };
      
      // Update Auth profile name if it changed (this is fine as it's short)
      if (formData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: formData.displayName });
      }

      await setDoc(doc(db, 'users', user.uid), newProfile);
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 flex">
          <motion.div 
            className="bg-indigo-600 h-full"
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome to MicroGig!</h2>
                  <p className="text-gray-500 font-medium text-lg">Let's start with your basic profile.</p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <img
                      src={formData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                      alt="Profile"
                      className="w-32 h-32 rounded-[2rem] border-4 border-indigo-50 shadow-xl object-cover bg-white"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {uploading ? (
                        <Loader2 size={32} className="text-white animate-spin" />
                      ) : (
                        <Camera size={32} className="text-white" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                  </div>

                  <div className="w-full space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-lg"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.displayName.trim()}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight size={24} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Choose your path</h2>
                  <p className="text-gray-500 font-medium text-lg">How do you plan to use MicroGig?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <RoleOption 
                    icon={<ShoppingBag size={24} />}
                    title="Buyer"
                    description="I want to hire talent and get things done."
                    selected={formData.role === 'buyer'}
                    onClick={() => setFormData({ ...formData, role: 'buyer' })}
                  />
                  <RoleOption 
                    icon={<Briefcase size={24} />}
                    title="Seller"
                    description="I want to offer my services and earn money."
                    selected={formData.role === 'seller'}
                    onClick={() => setFormData({ ...formData, role: 'seller' })}
                  />
                  <RoleOption 
                    icon={<Users size={24} />}
                    title="Both"
                    description="I want to do both hiring and selling."
                    selected={formData.role === 'both'}
                    onClick={() => setFormData({ ...formData, role: 'both' })}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    Continue <ArrowRight size={24} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Almost there!</h2>
                  <p className="text-gray-500 font-medium text-lg">Tell us a little bit about yourself.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Short Bio</label>
                  <textarea
                    rows={5}
                    placeholder="E.g. I'm a professional graphic designer with 5 years of experience..."
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-lg"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-all"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={24} />}
                    {isSubmitting ? 'Finishing...' : 'Complete Setup'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const RoleOption = ({ icon, title, description, selected, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-6 ${
      selected 
        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-100' 
        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
    }`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
      selected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'
    }`}>
      {icon}
    </div>
    <div className="flex-1">
      <h4 className={`font-black text-lg ${selected ? 'text-indigo-900' : 'text-gray-900'}`}>{title}</h4>
      <p className={`text-sm font-medium ${selected ? 'text-indigo-600' : 'text-gray-500'}`}>{description}</p>
    </div>
    {selected && <CheckCircle className="text-indigo-600" size={24} />}
  </button>
);
