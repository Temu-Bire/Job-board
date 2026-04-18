import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { MessageSquare, User, Clock } from 'lucide-react';

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageAPI.getConversations(),
  });

  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Messages</h1>
              <p className="text-gray-600 dark:text-gray-300">Active conversations with {user?.role === 'recruiter' ? 'jobseekers' : 'recruiters'}</p>
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No messages yet</h3>
              <p className="text-gray-600 dark:text-gray-300">
                When you initiate or receive a message, it will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {conversations.map((conv) => (
                <div
                  key={conv.partner._id}
                  onClick={() => navigate(`/chat/${conv.partner._id}`)}
                  className="p-6 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {conv.partner.avatarUrl ? (
                      <img src={conv.partner.avatarUrl} alt={conv.partner.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                        {conv.partner.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                      {conv.partner.role}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {conv.lastMessage.isMine ? <span className="text-gray-400">You: </span> : ''}
                      {conv.lastMessage.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Inbox;
