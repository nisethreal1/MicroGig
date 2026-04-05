import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, or, and, deleteDoc, doc, writeBatch, getDocs, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Send, User, Search, MoreVertical, Phone, Video, MessageSquare, Trash2, X, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get('with');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (withUserId && user && withUserId !== user.uid) {
      setActiveChat(withUserId);
    }
  }, [withUserId, user]);

  useEffect(() => {
    if (!user) return;

    // Fetch all chats for the user (simplified)
    const q = query(
      collection(db, 'messages'),
      or(where('senderId', '==', user.uid), where('receiverId', '==', user.uid)),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Group by unique contact
      const chatMap = new Map();
      msgs.forEach((m: any) => {
        const contactId = m.senderId === user.uid ? m.receiverId : m.senderId;
        if (!chatMap.has(contactId)) {
          chatMap.set(contactId, {
            contactId,
            lastMessage: m.content,
            createdAt: m.createdAt,
          });
        }
      });
      setChats(Array.from(chatMap.values()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || !activeChat) return;

    const q = query(
      collection(db, 'messages'),
      or(
        and(where('senderId', '==', user.uid), where('receiverId', '==', activeChat)),
        and(where('senderId', '==', activeChat), where('receiverId', '==', user.uid))
      ),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return unsubscribe;
  }, [user, activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChat || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: activeChat,
        content: newMessage,
        createdAt: new Date().toISOString(),
        updatedAt: null
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        content: editingContent,
        updatedAt: new Date().toISOString()
      });
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      setMessageToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `messages/${messageId}`);
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !activeChat) return;
    setIsDeleting(true);
    try {
      const q = query(
        collection(db, 'messages'),
        or(
          and(where('senderId', '==', user.uid), where('receiverId', '==', activeChat)),
          and(where('senderId', '==', activeChat), where('receiverId', '==', user.uid))
        )
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      setActiveChat(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'messages');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return <div className="p-20 text-center">Please sign in to view messages.</div>;

  return (
    <div className="bg-gray-50 h-[calc(100-64px)] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-96 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50">
          <h1 className="text-2xl font-black text-gray-900 mb-6">Messages</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {chats.map(chat => (
            <button
              key={chat.contactId}
              onClick={() => setActiveChat(chat.contactId)}
              className={`w-full p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left ${activeChat === chat.contactId ? 'bg-indigo-50/50 border-r-4 border-indigo-600' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-900 truncate">User {chat.contactId.slice(-6)}</h4>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate font-medium">{chat.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-white overflow-hidden">
        {activeChat ? (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">User {activeChat.slice(-6)}</h3>
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <button className="hover:text-indigo-600 transition-colors"><Phone size={20} /></button>
                <button className="hover:text-indigo-600 transition-colors"><Video size={20} /></button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                  title="Delete Chat"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group relative p-4 rounded-2xl shadow-sm font-medium text-sm ${
                    m.senderId === user.uid
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                  }`}>
                    {editingMessageId === m.id ? (
                      <div className="space-y-2 min-w-[200px]">
                        <textarea
                          className="w-full p-2 rounded-lg bg-indigo-700 text-white border border-indigo-400 focus:outline-none text-sm"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingMessageId(null)}
                            className="px-2 py-1 text-[10px] uppercase font-bold hover:bg-indigo-500 rounded transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleUpdateMessage(m.id)}
                            className="px-2 py-1 text-[10px] uppercase font-bold bg-white text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        <div className={`flex items-center justify-between gap-4 mt-2 ${m.senderId === user.uid ? 'text-indigo-200' : 'text-gray-400'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-widest">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {m.updatedAt && <span className="ml-2 italic opacity-70">(edited)</span>}
                          </div>
                          
                          {m.senderId === user.uid && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingMessageId(m.id);
                                  setEditingContent(m.content);
                                }}
                                className="hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => setMessageToDelete(m.id)}
                                className="hover:text-red-300 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-100 bg-white">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Send size={24} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500 max-w-sm">Choose a chat from the sidebar to start messaging with buyers or sellers.</p>
          </div>
        )}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Chat?</h3>
              <p className="text-gray-500 mb-8 font-medium">
                Are you sure you want to delete this entire conversation? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChat}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Message Confirmation Modal */}
      <AnimatePresence>
        {messageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessageToDelete(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Message?</h3>
              <p className="text-gray-500 mb-8 font-medium text-sm">
                Are you sure you want to delete this message?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setMessageToDelete(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMessage(messageToDelete)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
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
