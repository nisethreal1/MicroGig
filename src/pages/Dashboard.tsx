import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, deleteDoc, or } from 'firebase/firestore';
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
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Welcome back, {profile?.displayName || user.displayName}!</h1>
            <p className="text-gray-500 font-medium">Here's what's happening with your {isSeller ? 'business' : 'orders'} today.</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button className={`px-6 py-2 rounded-xl font-bold transition-all ${isSeller ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>Seller</button>
            <button className={`px-6 py-2 rounded-xl font-bold transition-all ${!isSeller ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50'}`}>Buyer</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard icon={<Package className="text-indigo-600" />} label="Active Orders" value={stats.activeOrders} color="indigo" />
          <StatCard icon={<CheckCircle className="text-emerald-600" />} label="Completed" value={stats.completedOrders} color="emerald" />
          <StatCard icon={<DollarSign className="text-amber-600" />} label={isSeller ? "Total Earnings" : "Total Spent"} value={`$${stats.earnings}`} color="amber" />
          <StatCard icon={<Star className="text-purple-600" />} label="Avg. Rating" value={stats.avgRating} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Orders */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <Link to="/orders" className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
                  View all <ArrowRight size={16} />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentOrders.length > 0 ? (
                  recentOrders.map(order => (
                    <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{order.serviceTitle}</h4>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order #{order.id.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">${order.price}</p>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-400 font-medium">No recent orders found.</div>
                )}
              </div>
            </div>
          </div>

          {/* Side Content */}
          <div className="lg:col-span-1 space-y-8">
            {isSeller ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Services</h2>
                  <Link to="/services/new" className="text-indigo-600 font-bold text-sm hover:underline">Add New</Link>
                </div>
                <div className="space-y-4">
                  {myServices.map(service => (
                    <div key={service.id} className="group relative">
                      <Link to={`/services/${service.id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                        <img src={`https://picsum.photos/seed/${service.id}/100/100`} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-sm">{service.title}</h4>
                          <p className="text-xs text-gray-500">${service.price}</p>
                        </div>
                      </Link>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/services/${service.id}/edit`);
                          }}
                          className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"
                          title="Edit Service"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingId(service.id);
                          }}
                          className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100 shadow-sm transition-all"
                          title="Delete Service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-indigo-600 rounded-3xl shadow-xl p-8 text-white">
                <h2 className="text-xl font-bold mb-4">Start Selling!</h2>
                <p className="text-indigo-100 mb-6 font-medium">Have a skill you want to monetize? Switch to a seller account and post your first gig.</p>
                <Link to="/profile" className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all">
                  Become a Seller
                </Link>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon={<MessageSquare size={20} />} label="Messages" to="/messages" />
                <QuickAction icon={<ShoppingBag size={20} />} label="Orders" to="/orders" />
                <QuickAction icon={<Star size={20} />} label="Reviews" to="/profile" />
                <QuickAction icon={<Clock size={20} />} label="History" to="/orders" />
              </div>
            </div>
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

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-gray-900">{value}</p>
  </div>
);

const QuickAction = ({ icon, label, to }: any) => (
  <Link to={to} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-50 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all gap-2 text-gray-600 font-bold text-xs uppercase tracking-wider">
    {icon}
    {label}
  </Link>
);
