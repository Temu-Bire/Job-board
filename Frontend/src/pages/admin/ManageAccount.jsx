import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';
import { UserPlus, Lock, Key, Mail, User } from 'lucide-react';

const ManageAccount = () => {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);

  // States for Password Change
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // States for Admin Creation
  const [adminData, setAdminData] = useState({ name: '', email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }
    try {
      setPasswordLoading(true);
      await userAPI.updatePassword(user._id, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setToast({ message: 'Password updated successfully!', type: 'success' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setToast({ message: error.message || 'Failed to update password', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAdminCreation = async (e) => {
    e.preventDefault();
    try {
      setAdminLoading(true);
      await userAPI.createAdmin(adminData);
      setToast({ message: 'New Admin created successfully!', type: 'success' });
      setAdminData({ name: '', email: '', password: '' });
    } catch (error) {
      setToast({ message: error.message || 'Failed to create admin', type: 'error' });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Manage Account</h1>
            <p className="text-gray-600 dark:text-gray-400">Update your credentials or register auxiliary administrators.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Password Reset Panel */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded-xl">
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>


            {/* Create Admin Panel */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
               <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl">
                  <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Admin</h2>
              </div>
              
              <form onSubmit={handleAdminCreation} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={adminData.name}
                      onChange={(e) => setAdminData({...adminData, name: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-transparent dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={adminData.email}
                      onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-transparent dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Initial Password</label>
                   <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={adminData.password}
                      onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-transparent dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={adminLoading}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex justify-center items-center gap-2"
                >
                  {adminLoading ? 'Creating...' : 'Register Administrator'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ManageAccount;
