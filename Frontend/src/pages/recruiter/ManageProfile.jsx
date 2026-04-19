import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';
import { User, Building, FileText, Link as LinkIcon, Image as ImageIcon, Edit2, X, Upload } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const ManageProfile = () => {
  const { user, updateUser } = useAuth();
  const profile = user?.profile || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    companyName: user?.company || profile.companyName || '',
    companyDescription: user?.companyDescription || profile.companyDescription || '',
    website: user?.website || profile.website || '',
    logoUrl: resolveMediaUrl(user?.logoUrl || profile.logoUrl || ''),
    phone: user?.phone || profile.phone || '',
    location: profile.location || '',
  });

  const logoInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const p = user.profile || {};
    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      companyName: user.company || p.companyName || '',
      companyDescription: user.companyDescription || p.companyDescription || '',
      website: user.website || p.website || '',
      logoUrl: resolveMediaUrl(user.logoUrl || p.logoUrl || ''),
      phone: user.phone || p.phone || '',
      location: p.location || '',
    }));
  }, [user?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [updatedUser, updatedProfile] = await Promise.all([
        userAPI.updateProfile(user._id, { name: formData.name, email: formData.email }),
        userAPI.updateRecruiterProfile(user._id, {
          companyName: formData.companyName,
          companyDescription: formData.companyDescription,
          website: formData.website,
          phone: formData.phone,
          location: formData.location,
        }),
      ]);

      updateUser({ 
        name: updatedUser.name, 
        email: updatedUser.email, 
        company: updatedProfile.companyName,
        companyDescription: updatedProfile.companyDescription,
        website: updatedProfile.website,
        profile: updatedProfile 
      });
      setToast({ message: 'Company profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ message: error?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await userAPI.uploadRecruiterLogo(user._id, file);
      const rawUrl = res.logoUrl || res?.profile?.logoUrl || '';
      const resolved = resolveMediaUrl(rawUrl);
      const cacheBusted = resolved ? `${resolved}${resolved.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
      setFormData((prev) => ({ ...prev, logoUrl: cacheBusted }));
      
      const newProfile = { ...(res.profile || {}), logoUrl: cacheBusted };
      updateUser({ profile: newProfile, logoUrl: cacheBusted });
      setToast({ message: 'Company logo updated!', type: 'success' });
    } catch (error) {
      console.error('Logo upload failed:', error);
      setToast({ message: 'Failed to upload photo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderViewMode = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-100 shadow-md">
              {formData.logoUrl ? (
                <img src={resolveMediaUrl(formData.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="w-16 h-16 text-gray-400 mx-auto mt-6" />
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formData.name}</h2>
            <p className="text-blue-600 dark:text-blue-400 font-medium text-lg mb-2">{formData.companyName || 'Company not specified'}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
              {formData.location && <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-gray-400" /> {formData.location}</span>}
              {formData.phone && <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-gray-400" /> {formData.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Company Description</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {formData.companyDescription || <span className="italic text-gray-400">No description provided yet.</span>}
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Website</h3>
            {formData.website ? (
              <a href={formData.website} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40 transition-colors">
                <LinkIcon className="w-6 h-6" />
                <span className="font-medium truncate">{formData.website}</span>
              </a>
            ) : (
               <p className="text-gray-500 italic">No website provided.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditMode = () => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Company Profile</h2>
        </div>
        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <div className="flex items-start gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Company Logo</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-inner">
              {formData.logoUrl ? (
                <img src={resolveMediaUrl(formData.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={loading}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="w-4 h-4 text-gray-400" /></div>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div>
             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building className="w-4 h-4 text-gray-400" /></div>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location / Headquarters</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building className="w-4 h-4 text-gray-400" /></div>
              <input type="text" name="location" placeholder="e.g. San Francisco, CA" value={formData.location} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Phone</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="w-4 h-4 text-gray-400" /></div>
              <input type="tel" name="phone" placeholder="(123) 456-7890" value={formData.phone} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Website URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><LinkIcon className="w-4 h-4 text-gray-400" /></div>
              <input type="url" name="website" placeholder="https://" value={formData.website} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Description</label>
            <div className="relative">
              <div className="absolute inset-y-3 left-0 pl-4 flex items-start pointer-events-none"><FileText className="w-4 h-4 text-gray-400" /></div>
              <textarea name="companyDescription" rows="5" value={formData.companyDescription} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-transparent dark:border-gray-600 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-400">
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {isEditing ? renderEditMode() : renderViewMode()}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ManageProfile;
