import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { Search, User, Star, MessageSquare, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Sellers: React.FC = () => {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch all users who are sellers
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['seller', 'both']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSellers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredSellers = sellers.filter(seller => 
    seller.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100 pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-gray-900 mb-6 tracking-tight"
          >
            Find the Best <span className="text-indigo-600">Talent</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium"
          >
            Connect with top-rated freelancers and professionals ready to help you with your next big project.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative group"
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
            <input
              type="text"
              placeholder="Search sellers by name or expertise..."
              className="w-full pl-16 pr-6 py-5 rounded-3xl bg-white border-2 border-gray-100 shadow-xl focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-lg font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredSellers.map((seller, index) => (
                <motion.div
                  key={seller.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden group"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={seller.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.id}`}
                            alt={seller.displayName}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-50 group-hover:border-indigo-600 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {seller.displayName}
                          </h3>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                            <Star size={14} fill="currentColor" />
                            <span>4.9</span>
                            <span className="text-gray-400 font-medium">(120+)</span>
                          </div>
                        </div>
                      </div>
                      <ShieldCheck className="text-indigo-600" size={24} />
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {seller.bio || "This seller hasn't added a bio yet. They are a professional freelancer ready to help with your projects."}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {(seller.skills || ['Design', 'Development', 'Marketing']).slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                      <div className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                        <MapPin size={14} />
                        <span>Phnom Penh, KH</span>
                      </div>
                      {user?.uid !== seller.id && (
                        <Link
                          to={`/messages?with=${seller.id}`}
                          className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                        >
                          <MessageSquare size={18} />
                          Message
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No sellers found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find any sellers matching "{searchQuery}". Try a different search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
