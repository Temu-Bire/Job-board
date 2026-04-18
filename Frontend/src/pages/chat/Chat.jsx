import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';

const Chat = () => {
  const { user } = useAuth();
  const { userId } = useParams();

  const [messages, setMessages] = useState([]);  
  const [toast, setToast] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', userId],
    queryFn: () => messageAPI.getConversation(userId),
    enabled: !!userId,
  });

  const partner = data?.partner || null;

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://127.0.0.1:5000');
    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    const handleChatMessage = (payload) => {
      // Only append if it's part of this conversation
      if (
        payload.senderId === userId ||
        (payload.senderId === user?._id && payload.receiverId === userId)
      ) {
        setMessages((prev) => [...prev, payload]);
      }
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.disconnect();
    };
  }, [userId, user?._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await messageAPI.sendMessage(userId, text);
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch (error) {
      const msg = error?.message || error?.data?.message || 'Failed to send message';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8 flex flex-col">
        <div className="max-w-4xl mx-auto flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Chat with {partner?.name || 'User'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {partner?.email} • {partner?.role}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {messages.map((m) => {
              const mine = m.senderId === user?._id || m.senderId === user?.id;
              return (
                <div
                  key={m._id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg text-sm ${
                      mine
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                    }`}
                  >
                    <div>{m.message}</div>
                    <div className="mt-1 text-[10px] opacity-75">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Chat;

