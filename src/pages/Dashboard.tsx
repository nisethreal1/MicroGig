import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, deleteDoc, or, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, DollarSign, Star, Clock, ArrowRight, CheckCircle, Package, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    earnings: 0,
    avgRating: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'services'>('orders');

  const seedServices = async () => {
    if (!user || !profile) return;
    setIsSeeding(true);
    
    const exampleServices = [
      {
        title: "Professional Logo Design",
        description: "I will create a unique and professional logo for your brand. Includes 3 concepts and unlimited revisions.",
        price: 50,
        category: "Design",
        deliveryTime: "3 Days",
        coverImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Full Stack Web Development",
        description: "Custom web application development using React, Node.js, and Firebase. Responsive and high-performance.",
        price: 500,
        category: "Tech",
        deliveryTime: "14 Days",
        coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "SEO Optimization & Audit",
        description: "Complete SEO audit and optimization to rank your website on the first page of Google.",
        price: 150,
        category: "Marketing",
        deliveryTime: "7 Days",
        coverImage: "https://images.unsplash.com/photo-1571721795195-a2ca2d3370a9?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Social Media Marketing",
        description: "Manage your social media accounts, create engaging content, and grow your audience.",
        price: 200,
        category: "Marketing",
        deliveryTime: "30 Days",
        coverImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Video Editing & Post Production",
        description: "Professional video editing for YouTube, social media, or corporate presentations.",
        price: 100,
        category: "Video",
        deliveryTime: "5 Days",
        coverImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Content Writing & Copywriting",
        description: "High-quality blog posts, articles, and website copy that converts visitors into customers.",
        price: 40,
        category: "Writing",
        deliveryTime: "2 Days",
        coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Mobile App Development",
        description: "Build cross-platform mobile apps for iOS and Android using React Native.",
        price: 800,
        category: "Tech",
        deliveryTime: "21 Days",
        coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "UI/UX Design (Figma)",
        description: "Modern and intuitive user interface design for your web or mobile application.",
        price: 300,
        category: "Design",
        deliveryTime: "10 Days",
        coverImage: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Virtual Assistant Services",
        description: "Administrative support, data entry, email management, and scheduling.",
        price: 15,
        category: "Writing",
        deliveryTime: "1 Day",
        coverImage: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Translation Services",
        description: "Accurate translation between English and Khmer for documents, websites, and more.",
        price: 25,
        category: "Writing",
        deliveryTime: "2 Days",
        coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80"
      }
    ];

    try {
      for (const service of exampleServices) {
        await addDoc(collection(db, 'services'), {
          ...service,
          sellerId: user.uid,
          sellerName: profile.displayName || user.displayName || 'Anonymous Seller',
          createdAt: serverTimestamp(),
          rating: 0,
          reviewCount: 0
        });
      }
      alert('Successfully added 10 example services!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'services');
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch stats and orders based on role
    const ordersQuery = query(
      collection(db, 'orders'),
      or(
        where('buyerId', '==', user.uid),
        where('sellerId', '==', user.uid)
      ),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRecentOrders(orders);

      // Calculate stats (simplified for MVP)
      const active = orders.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length;
      const completed = orders.filter((o: any) => o.status === 'completed').length;
      const totalEarnings = orders.filter((o: any) => o.status === 'completed').reduce((acc: number, o: any) => acc + o.price, 0);

      setStats({
        activeOrders: active,
        completedOrders: completed,
        earnings: totalEarnings,
        avgRating: 4.8, // Mock for now
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    // Fetch my services if seller
    let unsubscribeServices = () => {};
    if (isSeller) {
      const servicesQuery = query(
        collection(db, 'services'),
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
        setMyServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'services');
      });
    }

    return () => {
      unsubscribeOrders();
      unsubscribeServices();
    };
  }, [user, profile]);

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${serviceId}`);
    }
  };

  if (!user) return <div className="p-20 text-center">Please sign in to view your dashboard.</div>;

  const isSeller = profile?.role !== 'buyer';

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              Hello, <span className="text-indigo-600">{profile?.displayName || user.displayName}</span>
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Your {isSeller ? 'business' : 'orders'} overview for today
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm"
          >
            <button 
              onClick={() => navigate('/dashboard')} // Assuming this is the current page
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isSeller ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Seller Mode
            </button>
            <button 
              onClick={() => navigate('/dashboard')} // In a real app, this might toggle a state
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${!isSeller ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Buyer Mode
            </button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard icon={<Package size={20} className="text-indigo-600" />} label="Active" value={stats.activeOrders} color="indigo" delay={0.1} />
          <StatCard icon={<CheckCircle size={20} className="text-emerald-600" />} label="Done" value={stats.completedOrders} color="emerald" delay={0.2} />
          <StatCard icon={<DollarSign size={20} className="text-amber-600" />} label={isSeller ? "Earnings" : "Spent"} value={`$${stats.earnings}`} color="amber" delay={0.3} />
          <StatCard icon={<Star size={20} className="text-purple-600" />} label="Rating" value={stats.avgRating} color="purple" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 gap-4">
                <div className="flex p-1.5 bg-slate-100/50 rounded-2xl gap-1">
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Orders
                  </button>
                  {isSeller && (
                    <button 
                      onClick={() => setActiveTab('services')}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'services' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Services
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {activeTab === 'orders' ? (
                    <Link to="/orders" className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-700 flex items-center gap-2 group">
                      View All Orders <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={seedServices}
                        disabled={isSeeding}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                      >
                        {isSeeding ? 'Seeding...' : 'Seed Data'}
                      </button>
                      <Link 
                        to="/services/new" 
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                      >
                        Add New
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-0">
                <AnimatePresence mode="wait">
                  {activeTab === 'orders' ? (
                    <motion.div 
                      key="orders"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="divide-y divide-slate-50"
                    >
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            key={order.id} 
                            className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <ShoppingBag size={22} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{order.serviceTitle}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">ID: {order.id.slice(-8)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="hidden sm:block text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                                  order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                  order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="text-right min-w-[80px]">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Price</p>
                                <p className="font-black text-slate-900 text-lg">${order.price}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-20 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No orders yet</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="services"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-8"
                    >
                      {myServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {myServices.map((service, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 * idx }}
                              key={service.id} 
                              className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-500"
                            >
                              <div className="aspect-[16/10] relative overflow-hidden">
                                <img 
                                  src={service.coverImage || `https://picsum.photos/seed/${service.id}/600/400`} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                  alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                  <button
                                    onClick={() => navigate(`/services/${service.id}/edit`)}
                                    className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-slate-700 hover:bg-white hover:text-indigo-600 transition-all"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingId(service.id)}
                                    className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-slate-700 hover:bg-white hover:text-red-600 transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 translate-y-[10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                  <Link to={`/services/${service.id}`} className="block w-full py-2.5 bg-white/90 backdrop-blur-md rounded-xl text-center text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-white transition-all">
                                    View Details
                                  </Link>
                                </div>
                              </div>
                              <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                    {service.category}
                                  </span>
                                  <div className="flex items-center gap-1 text-amber-500">
                                    <Star size={12} fill="currentColor" />
                                    <span className="text-xs font-black">{service.rating || '0.0'}</span>
                                  </div>
                                </div>
                                <h4 className="font-bold text-slate-900 mb-4 truncate text-lg">{service.title}</h4>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <Clock size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{service.deliveryTime || '3 Days'}</span>
                                  </div>
                                  <span className="text-xl font-black text-slate-900">${service.price}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star size={40} className="text-slate-200" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">No services yet</h3>
                          <p className="text-slate-400 mb-8 max-w-xs mx-auto font-medium">Start your business by creating your first service listing.</p>
                          <Link to="/services/new" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                            Create Service <ArrowRight size={18} />
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Side Content */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8"
            >
              <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase tracking-widest text-xs opacity-50">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon={<MessageSquare size={20} className="text-indigo-600" />} label="Messages" to="/messages" delay={0.7} />
                <QuickAction icon={<ShoppingBag size={20} className="text-emerald-600" />} label="Orders" to="/orders" delay={0.8} />
                <QuickAction icon={<Star size={20} className="text-amber-600" />} label="Reviews" to="/profile" delay={0.9} />
                <QuickAction icon={<Clock size={20} className="text-purple-600" />} label="History" to="/orders" delay={1.0} />
              </div>
            </motion.div>

            {!isSeller && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-200 p-8 text-white relative overflow-hidden group"
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-black mb-4 tracking-tight">Start Selling</h2>
                  <p className="text-indigo-100 mb-8 font-medium text-sm leading-relaxed">Turn your skills into income. Join our community of expert sellers today.</p>
                  <Link to="/profile" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-xl">
                    Become Seller <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-slate-900 rounded-[2.5rem] p-8 text-white"
            >
              <h3 className="text-lg font-bold mb-4">Pro Tip</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Sellers who respond to messages within 1 hour are 3x more likely to get hired.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Boost your rank</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
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
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteService(deletingId)}
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

const StatCard = ({ icon, label, value, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  </motion.div>
);

const QuickAction = ({ icon, label, to, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
  >
    <Link to={to} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:bg-white hover:border-indigo-100 hover:shadow-md hover:text-indigo-600 transition-all gap-2 text-gray-600 font-bold text-[10px] uppercase tracking-wider">
      <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      {label}
    </Link>
  </motion.div>
);
