import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Star, Clock, User, Shield, MessageSquare, ShoppingCart, ArrowLeft, CreditCard, QrCode, Edit, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export const ServiceDetails: React.FC = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'khqr' | 'visa'>('khqr');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'services', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `services/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'services', id!));
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      alert('Please sign in to place an order');
      return;
    }
    if (user.uid === service.sellerId) {
      alert('You cannot buy your own service');
      return;
    }

    setOrdering(true);
    try {
      const orderData = {
        buyerId: user.uid,
        sellerId: service.sellerId,
        serviceId: service.id,
        serviceTitle: service.title,
        status: 'pending',
        price: service.price,
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      navigate(`/orders?id=${docRef.id}`);
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setOrdering(false);
    }
  };

  const handleMessage = () => {
    if (!user) {
      alert('Please sign in to message the seller');
      return;
    }
    if (user.uid === service.sellerId) {
      alert('You cannot message yourself');
      return;
    }
    navigate(`/messages?with=${service.sellerId}`);
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">Loading service...</div>;
  if (!service) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Service not found</div>;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 font-medium transition-colors">
          <ArrowLeft size={20} />
          Back to browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Content */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                {service.title}
              </h1>
              {user?.uid === service.sellerId && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/services/${service.id}/edit`)}
                    className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-600 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all flex items-center gap-2 font-bold text-sm"
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-600 hover:text-red-600 hover:border-red-100 shadow-sm transition-all flex items-center gap-2 font-bold text-sm"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{service.sellerName}</p>
                  <p className="text-xs text-gray-500">Top Rated Seller</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-100"></div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={20} fill="currentColor" />
                <span className="text-lg font-bold">{service.rating || 'New'}</span>
                <span className="text-sm text-gray-400 font-normal">({service.reviewCount || 0} reviews)</span>
              </div>
            </div>

            <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 mb-10 shadow-2xl relative">
              <img
                src={service.coverImage || `https://picsum.photos/seed/${service.id}/1200/800`}
                alt={service.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {!user && (
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 text-white backdrop-blur-xl border border-white/30">
                    <Shield size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-4">Sign in to see full details</h2>
                  <p className="text-indigo-50 font-medium max-w-md mb-8">
                    To protect our community and ensure secure transactions, you need to be signed in to view service descriptions and contact sellers.
                  </p>
                  <button 
                    onClick={() => navigate('/onboarding')}
                    className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl"
                  >
                    Get Started Now
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="prose prose-indigo max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this service</h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  <ReactMarkdown>{service.description}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="space-y-4 blur-[2px] select-none pointer-events-none opacity-50">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this service</h2>
                <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-full w-full"></div>
                <div className="h-4 bg-gray-200 rounded-full w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
              </div>
            )}
          </div>

          {/* Right Column: Order Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Standard Package</span>
                    <span className="text-3xl font-black text-gray-900">${service.price}</span>
                  </div>

                  <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                    Full service delivery including all source files and commercial rights.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-700 font-medium">
                      <Clock size={20} className="text-indigo-600" />
                      <span>{service.deliveryTime} Delivery</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 font-medium">
                      <Shield size={20} className="text-indigo-600" />
                      <span>Secure Payment Escrow</span>
                    </div>
                  </div>

                  {user ? (
                    user.uid !== service.sellerId ? (
                      <>
                        <AnimatePresence mode="wait">
                          {!showCheckout ? (
                            <motion.div
                              key="cta"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <button
                                onClick={() => setShowCheckout(true)}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                              >
                                <ShoppingCart size={20} />
                                Continue to Checkout
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="checkout"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-6"
                            >
                              <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Payment Method</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={() => setPaymentMethod('khqr')}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                      paymentMethod === 'khqr' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                  >
                                    <QrCode size={24} className={paymentMethod === 'khqr' ? 'text-indigo-600' : 'text-gray-400'} />
                                    <span className={`text-xs font-bold ${paymentMethod === 'khqr' ? 'text-indigo-600' : 'text-gray-500'}`}>Khmer KHQR</span>
                                  </button>
                                  <button
                                    onClick={() => setPaymentMethod('visa')}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                      paymentMethod === 'visa' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                  >
                                    <CreditCard size={24} className={paymentMethod === 'visa' ? 'text-indigo-600' : 'text-gray-400'} />
                                    <span className={`text-xs font-bold ${paymentMethod === 'visa' ? 'text-indigo-600' : 'text-gray-500'}`}>Visa Card</span>
                                  </button>
                                </div>
                              </div>

                              {paymentMethod === 'khqr' ? (
                                <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                  <p className="text-xs text-gray-500 mb-3 font-medium">Scan this QR code with your banking app</p>
                                  <div className="w-32 h-32 bg-white mx-auto rounded-lg border border-gray-200 flex items-center justify-center mb-2">
                                    <QrCode size={80} className="text-gray-900" />
                                  </div>
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Supported by Bakong</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    placeholder="Card Number"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="MM/YY"
                                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                    <input
                                      type="text"
                                      placeholder="CVV"
                                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3">
                                <button
                                  onClick={() => setShowCheckout(false)}
                                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                                >
                                  Back
                                </button>
                                <button
                                  onClick={handleOrder}
                                  disabled={ordering}
                                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
                                >
                                  {ordering ? 'Processing...' : `Pay $${service.price}`}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={handleMessage}
                          className="w-full mt-4 bg-white text-indigo-600 border-2 border-indigo-600 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={20} />
                          Contact Seller
                        </button>
                      </>
                    ) : (
                      <div className="p-6 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
                        <p className="text-sm font-bold text-gray-500 italic">This is your gig. You can manage it from the Dashboard.</p>
                      </div>
                    )
                  ) : (
                    <div className="p-6 bg-indigo-50 rounded-2xl text-center border border-indigo-100">
                      <p className="text-sm font-bold text-indigo-700 mb-4">Sign in to purchase this service or contact the seller.</p>
                      <button 
                        onClick={() => navigate('/onboarding')}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-6 text-center">
                  <p className="text-xs text-gray-500 font-medium">
                    100% Satisfaction Guaranteed. Money-back if not delivered.
                  </p>
                </div>
              </div>

              {user?.uid !== service.sellerId && (
                <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-2">Need a custom offer?</h4>
                  <p className="text-sm text-indigo-700 mb-4">
                    If you have specific requirements, message the seller for a tailored quote.
                  </p>
                  <button
                    onClick={handleMessage}
                    className="text-indigo-600 font-bold text-sm hover:underline"
                  >
                    Request Custom Quote →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Gig?</h3>
              <p className="text-gray-500 mb-8 font-medium">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
