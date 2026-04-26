import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { connectAuthSocket } from '../../utils/socket';
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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
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

    const socket = connectAuthSocket(token);
    if (!socket) return undefined;
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
    const handleChatMessageUpdated = (payload) => {
      setMessages((prev) => prev.map((m) => (m._id === payload._id ? { ...m, ...payload } : m)));
    };
    const handleChatMessageDeleted = (payload) => {
      setMessages((prev) => prev.filter((m) => m._id !== payload._id));
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('chat_message_updated', handleChatMessageUpdated);
    socket.on('chat_message_deleted', handleChatMessageDeleted);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('chat_message_updated', handleChatMessageUpdated);
      socket.off('chat_message_deleted', handleChatMessageDeleted);
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

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (messageId) => {
    const text = editingText.trim();
    if (!text) return;
    setSavingEdit(true);
    try {
      const updated = await messageAPI.editMessage(messageId, text);
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, ...updated } : m)));
      cancelEditing();
    } catch (error) {
      const msg = error?.message || error?.data?.message || 'Failed to edit message';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (messageId) => {
    setDeletingMessageId(messageId);
    try {
      await messageAPI.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (editingMessageId === messageId) cancelEditing();
    } catch (error) {
      const msg = error?.message || error?.data?.message || 'Failed to delete message';
      setToast({ message: msg, type: 'error' });
    } finally {
      setDeletingMessageId(null);
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
                    {editingMessageId === m._id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-2 py-1 text-xs rounded bg-gray-500 text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingEdit || !editingText.trim()}
                            onClick={() => handleSaveEdit(m._id)}
                            className="px-2 py-1 text-xs rounded bg-green-600 text-white disabled:bg-green-400"
                          >
                            {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>{m.message}</div>
                    )}
                    <div className="mt-1 text-[10px] opacity-75">
                      {new Date(m.createdAt).toLocaleTimeString()}
                      {m.updatedAt && m.updatedAt !== m.createdAt ? ' (edited)' : ''}
                    </div>
                    {editingMessageId !== m._id && (
                      <div className="mt-2 flex gap-2 justify-end">
                        {mine && (
                          <button
                            type="button"
                            onClick={() => startEditing(m)}
                            className="px-2 py-1 text-xs rounded bg-white/25 hover:bg-white/35"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingMessageId === m._id}
                          onClick={() => handleDelete(m._id)}
                          className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                        >
                          {deletingMessageId === m._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
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

