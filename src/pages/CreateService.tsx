import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Save, Image as ImageIcon, DollarSign, Clock, Tag } from 'lucide-react';

export const CreateService: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deliveryTime: '3 Days',
    category: 'Design',
    coverImage: '',
  });

  const categories = ['Design', 'Writing', 'Tech', 'Marketing', 'Video', 'Music'];

  useEffect(() => {
    if (isEditing) {
      const fetchService = async () => {
        try {
          const docRef = doc(db, 'services', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Security check: only seller can edit
            if (data.sellerId !== user?.uid) {
              navigate('/dashboard');
              return;
            }
            setFormData({
              title: data.title,
              description: data.description,
              price: data.price.toString(),
              deliveryTime: data.deliveryTime,
              category: data.category,
              coverImage: data.coverImage || '',
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `services/${id}`);
        } finally {
          setFetching(false);
        }
      };
      if (user) fetchService();
    }
  }, [id, isEditing, user, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const serviceData = {
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        deliveryTime: formData.deliveryTime,
        category: formData.category,
        coverImage: formData.coverImage,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'services', id), serviceData);
        navigate(`/services/${id}`);
      } else {
        const docRef = await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: new Date().toISOString(),
          rating: 0,
          reviewCount: 0,
        });
        navigate(`/services/${docRef.id}`);
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || profile?.role === 'buyer') {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Only sellers can post services.</div>;
  }

  if (fetching) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading gig details...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 font-medium transition-colors">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-black mb-2">{isEditing ? 'Edit Your Gig' : 'Post a New Gig'}</h1>
            <p className="text-indigo-100 font-medium">
              {isEditing ? 'Update your gig details to keep it fresh.' : 'Share your skills with the world and start earning.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={16} /> Gig Cover Image
              </label>
              <div className="relative group">
                <div className={`w-full h-64 rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-gray-50 ${
                  formData.coverImage ? 'border-indigo-100' : 'border-gray-200 hover:border-indigo-300'
                }`}>
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8">
                      <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">Click to upload a cover image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or WebP (Max 1MB recommended)</p>
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploading && <div className="bg-white/90 p-4 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-indigo-600 animate-pulse">
                      Uploading...
                    </div>}
                  </label>
                </div>
                {formData.coverImage && (
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: '' })}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all shadow-lg font-bold text-xs uppercase tracking-widest"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Gig Title</label>
              <input
                required
                type="text"
                placeholder="I will design a modern logo for your startup"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all text-lg font-medium"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <p className="text-xs text-gray-400">Start with "I will..." for better visibility.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={16} /> Category
                </label>
                <select
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={16} /> Price (USD)
                </label>
                <input
                  required
                  type="number"
                  min="5"
                  step="5"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} /> Delivery Time
              </label>
              <select
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              >
                <option>1 Day</option>
                <option>2 Days</option>
                <option>3 Days</option>
                <option>5 Days</option>
                <option>7 Days</option>
                <option>14 Days</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Description</label>
              <textarea
                required
                rows={8}
                placeholder="Describe what you offer in detail. Mention what's included and what's not."
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
              <p className="text-xs text-gray-400">Markdown is supported.</p>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                <Save size={24} />
                {loading ? (isEditing ? 'Updating Gig...' : 'Creating Gig...') : (isEditing ? 'Update Gig' : 'Publish Gig')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
