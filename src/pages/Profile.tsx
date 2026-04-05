import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, updateProfile } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Shield, Save, CheckCircle, CreditCard, QrCode, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'payment'>('info');
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    role: profile?.role || 'buyer',
    skills: profile?.skills?.join(', ') || '',
    photoURL: profile?.photoURL || user?.photoURL || '',
    paymentMethods: profile?.paymentMethods || [
      { id: '1', type: 'khqr', label: 'Khmer KHQR', details: 'Connected to Bakong', isPrimary: true },
      { id: '2', type: 'visa', label: 'Visa Card', details: '**** **** **** 4242', isPrimary: false }
    ],
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: base64String
        });

        setFormData(prev => ({ ...prev, photoURL: base64String }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        role: formData.role,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        paymentMethods: formData.paymentMethods,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = (payment: any) => {
    const targetId = editingPayment?.id || payment.id;
    let newMethods;

    if (targetId && formData.paymentMethods.some((m: any) => m.id === targetId)) {
      // Update existing
      newMethods = formData.paymentMethods.map((m: any) => 
        m.id === targetId ? { ...payment, id: targetId } : m
      );
    } else {
      // Add new
      const newId = Date.now().toString();
      newMethods = [...formData.paymentMethods, { ...payment, id: newId }];
    }
    
    // If setting as primary, unset others
    if (payment.isPrimary) {
      const primaryId = targetId || newMethods[newMethods.length - 1].id;
      newMethods = newMethods.map((m: any) => ({
        ...m,
        isPrimary: m.id === primaryId
      }));
    }

    setFormData({ ...formData, paymentMethods: newMethods });
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const handleDeletePayment = (id: string) => {
    setFormData({
      ...formData,
      paymentMethods: formData.paymentMethods.filter((m: any) => m.id !== id)
    });
  };

  if (!user) return <div className="p-20 text-center">Please sign in to view your profile.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 h-32 relative">
            <div className="absolute -bottom-12 left-8 group">
              <div className="relative">
                <img
                  src={formData.photoURL || 'https://via.placeholder.com/100'}
                  alt="Profile"
                  className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg object-cover bg-white"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-3xl font-black text-gray-900">{formData.displayName || user.displayName}</h1>
                <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                  <Mail size={16} /> {user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-bold text-xs uppercase tracking-widest">
                <Shield size={16} />
                Verified Account
              </div>
            </div>

            <div className="flex border-b border-gray-100 mb-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-8 py-4 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-8 py-4 font-bold text-sm uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === 'payment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Payment Methods
              </button>
            </div>

            {activeTab === 'info' ? (
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Platform Role</label>
                    <select
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="buyer">Buyer (Looking for services)</option>
                      <option value="seller">Seller (Offering services)</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Skills (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="Logo Design, React, Copywriting"
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Biography</label>
                    <textarea
                      rows={8}
                      placeholder="Tell us about yourself and your expertise..."
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                        success ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                      }`}
                    >
                      {success ? <CheckCircle size={24} /> : <Save size={24} />}
                      {loading ? 'Updating...' : success ? 'Profile Updated!' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.paymentMethods.map((method: any) => (
                    <div 
                      key={method.id} 
                      className={`p-6 rounded-3xl border-2 relative overflow-hidden group transition-all ${
                        method.isPrimary ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                      }`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {method.type === 'khqr' ? <QrCode size={80} /> : <CreditCard size={80} />}
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          method.isPrimary ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {method.type === 'khqr' ? <QrCode size={20} /> : <CreditCard size={20} />}
                        </div>
                        <h3 className={`font-bold ${method.isPrimary ? 'text-indigo-900' : 'text-gray-900'}`}>{method.label}</h3>
                      </div>
                      <p className={`text-sm mb-4 ${method.isPrimary ? 'text-indigo-700' : 'text-gray-500'}`}>{method.details}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                          {method.isPrimary ? (
                            <span className="text-indigo-600 flex items-center gap-1">
                              <CheckCircle size={14} /> Primary
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleSavePayment({ ...method, isPrimary: true })}
                              className="text-gray-400 hover:text-indigo-600"
                            >
                              Set as Primary
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              setEditingPayment(method);
                              setShowPaymentModal(true);
                            }}
                            className="text-indigo-600 font-bold text-sm hover:underline"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeletePayment(method.id)}
                            className="text-red-600 font-bold text-sm hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    setEditingPayment(null);
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  + Add New Payment Method
                </button>

                <div className="pt-4">
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                      success ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                    }`}
                  >
                    {success ? <CheckCircle size={24} /> : <Save size={24} />}
                    {loading ? 'Saving...' : success ? 'Payments Saved!' : 'Save All Payment Methods'}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                  <h4 className="font-bold text-amber-900 mb-2">Security Note</h4>
                  <p className="text-sm text-amber-700">
                    Your payment information is encrypted and stored securely. We never share your full card details with sellers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-6">
                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              
              <PaymentForm 
                initialData={editingPayment || { type: 'khqr', label: '', details: '', isPrimary: false }}
                onSave={handleSavePayment}
                onCancel={() => setShowPaymentModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentForm = ({ initialData, onSave, onCancel }: any) => {
  const [data, setData] = useState(initialData);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type</label>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setData({ ...data, type: 'khqr', label: 'Khmer KHQR' })}
            className={`p-4 rounded-2xl border-2 flex items-center gap-3 font-bold transition-all ${
              data.type === 'khqr' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'
            }`}
          >
            <QrCode size={20} /> KHQR
          </button>
          <button 
            onClick={() => setData({ ...data, type: 'visa', label: 'Visa Card' })}
            className={`p-4 rounded-2xl border-2 flex items-center gap-3 font-bold transition-all ${
              data.type === 'visa' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-500'
            }`}
          >
            <CreditCard size={20} /> Visa
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Label</label>
        <input
          type="text"
          placeholder="e.g. My Primary Card"
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
          value={data.label}
          onChange={(e) => setData({ ...data, label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details</label>
        <input
          type="text"
          placeholder={data.type === 'khqr' ? 'Bakong ID or Phone' : 'Card Number (last 4 digits)'}
          className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
          value={data.details}
          onChange={(e) => setData({ ...data, details: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
          data.isPrimary ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200 group-hover:border-indigo-300'
        }`}>
          {data.isPrimary && <CheckCircle size={14} className="text-white" />}
        </div>
        <input 
          type="checkbox" 
          className="hidden" 
          checked={data.isPrimary}
          onChange={(e) => setData({ ...data, isPrimary: e.target.checked })}
        />
        <span className="font-bold text-gray-700">Set as primary payment method</span>
      </label>

      <div className="flex gap-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(data)}
          disabled={!data.label || !data.details}
          className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          Save Method
        </button>
      </div>
    </div>
  );
};
