import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, or } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShoppingBag, Clock, CheckCircle, XCircle, MessageSquare, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Orders: React.FC = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      or(
        where('buyerId', '==', user.uid),
        where('sellerId', '==', user.uid)
      ),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return unsubscribe;
  }, [user, profile]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  if (!user) return <div className="p-20 text-center">Please sign in to view your orders.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-black text-gray-900 mb-12">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-gray-100"></div>)}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all group">
                <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${order.serviceId}/200/200`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{order.serviceTitle}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>Order #{order.id.slice(-8)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:gap-8">
                    <div className="text-center md:text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Price</p>
                      <p className="text-2xl font-black text-gray-900">${order.price}</p>
                    </div>

                    <div className="text-center md:text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
                      <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/messages?with=${user.uid === order.sellerId ? order.buyerId : order.sellerId}`}
                        className="p-4 rounded-2xl bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100"
                        title="Message"
                      >
                        <MessageSquare size={20} />
                      </Link>
                      
                      {user.uid === order.sellerId && order.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(order.id, 'in-progress')}
                          className="px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                          Accept Order
                        </button>
                      )}

                      {user.uid === order.sellerId && order.status === 'in-progress' && (
                        <button
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                        >
                          <CheckCircle size={20} />
                          Deliver Work
                        </button>
                      )}

                      {user.uid === order.buyerId && order.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                          <XCircle size={20} />
                          Cancel
                        </button>
                      )}

                      {(order.status === 'completed' || order.status === 'cancelled') && (
                        <button
                          onClick={() => setDeletingId(order.id)}
                          className="p-4 rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100"
                          title="Delete Order History"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              You haven't placed or received any orders yet. Start exploring services to get started.
            </p>
            <Link to="/" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              Browse Services
            </Link>
          </div>
        )}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Order?</h3>
              <p className="text-gray-500 mb-8 font-medium">
                Are you sure you want to delete this order from your history? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteOrder(deletingId)}
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
