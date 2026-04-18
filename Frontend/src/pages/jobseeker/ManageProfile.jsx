import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';
import { User, Mail, Phone, GraduationCap, Calendar, FileText, Plus, X, Upload, Link as LinkIcon, Image as ImageIcon, Edit2, Github, Linkedin, Award } from 'lucide-react';

const ManageProfile = () => {
  const { user, updateUser } = useAuth();
  const profile = user?.profile || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    university: profile.university || '',
    degree: profile.degree || '',
    graduationYear: profile.graduationYear || 2025,
    phone: profile.phone || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    avatarUrl: profile.avatarUrl || '',
  });
  
  const [skills, setSkills] = useState(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [resume, setResume] = useState(profile.resumeUrl || '');

  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

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
        userAPI.updateJobseekerProfile(user._id, {
          university: formData.university,
          degree: formData.degree,
          graduationYear: Number(formData.graduationYear),
          skills,
          resumeUrl: resume,
          phone: formData.phone,
          githubUrl: formData.githubUrl,
          linkedinUrl: formData.linkedinUrl,
          avatarUrl: formData.avatarUrl,
        }),
      ]);

      updateUser({ name: updatedUser.name, email: updatedUser.email, profile: updatedProfile });
      setToast({ message: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false); // Switch back to view mode on success
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ message: error?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await userAPI.uploadResume(user._id, file);
      const newUrl = res.resumeUrl || res?.profile?.resumeUrl || '';
      setResume(newUrl);
      updateUser({ profile: res.profile });
      setToast({ message: 'Resume uploaded!', type: 'success' });
    } catch (error) {
      console.error('Resume upload failed:', error);
      setToast({ message: 'Failed to upload resume', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await userAPI.uploadAvatar(user._id, file);
      const rawUrl = res.avatarUrl || res?.profile?.avatarUrl || '';
      const cacheBusted = rawUrl ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
      setFormData((prev) => ({ ...prev, avatarUrl: cacheBusted }));
      
      const newProfile = { ...(res.profile || {}), avatarUrl: cacheBusted };
      updateUser({ profile: newProfile });
      setToast({ message: 'Profile photo updated!', type: 'success' });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setToast({ message: 'Failed to upload photo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-100 shadow-md">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-gray-400 mx-auto mt-6" />
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
            <p className="text-blue-600 dark:text-blue-400 font-medium text-lg mb-2">{formData.degree} at {formData.university || 'University not specified'}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
              {formData.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {formData.email}</span>}
              {formData.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {formData.phone}</span>}
              {formData.graduationYear && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Class of {formData.graduationYear}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Skills */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Professional Skills</h3>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No skills added yet.</p>
            )}
          </div>

          {/* Document Section */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Resume & Documents</h3>
            </div>
            {resume ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 truncate pr-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium truncate">My_Resume.pdf</span>
                </div>
                <a href={resume} target="_blank" rel="noreferrer" className="shrink-0 text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  View
                </a>
              </div>
            ) : (
              <p className="text-gray-500 italic">No resume uploaded.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Social Links */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Social Profiles</h3>
            <div className="space-y-4">
              <a href={formData.linkedinUrl || '#'} target="_blank" rel="noreferrer" className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${formData.linkedinUrl ? 'bg-[#f3f6f8] text-[#0a66c2] hover:shadow-md' : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-700'}`}>
                <Linkedin className="w-6 h-6" />
                <span className="font-medium">{formData.linkedinUrl ? 'LinkedIn' : 'Not Provided'}</span>
              </a>
              <a href={formData.githubUrl || '#'} target="_blank" rel="noreferrer" className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${formData.githubUrl ? 'bg-gray-900 text-white hover:shadow-md' : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-700'}`}>
                <Github className="w-6 h-6" />
                <span className="font-medium">{formData.githubUrl ? 'GitHub' : 'Not Provided'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditMode = () => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Profile</h2>
          <p className="text-gray-500">Update your personal and professional information.</p>
        </div>
        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <div className="flexflex-col items-start gap-6 mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Profile Photo</label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-inner">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div>
            <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={handleAvatarUpload} />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Change Photo
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {[
            { label: 'Full Name', name: 'name', type: 'text', icon: <User className="w-4 h-4 mr-3 text-gray-400" /> },
            { label: 'Email Address', name: 'email', type: 'email', icon: <Mail className="w-4 h-4 mr-3 text-gray-400" /> },
            { label: 'Phone Number', name: 'phone', type: 'tel', icon: <Phone className="w-4 h-4 mr-3 text-gray-400" /> },
            { label: 'University', name: 'university', type: 'text', icon: <GraduationCap className="w-4 h-4 mr-3 text-gray-400" /> },
            { label: 'Degree', name: 'degree', type: 'text', icon: <FileText className="w-4 h-4 mr-3 text-gray-400" /> },
            { label: 'Graduation Year', name: 'graduationYear', type: 'number', icon: <Calendar className="w-4 h-4 mr-3 text-gray-400" />, min: 2024, max: 2027 },
          ].map(({ label, name, type, icon, min, max }) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {icon}
                </div>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required={['name','email','university','degree','graduationYear'].includes(name)}
                  min={min}
                  max={max}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-all shadow-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">GitHub URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><LinkIcon className="w-4 h-4 text-gray-400" /></div>
              <input type="url" name="githubUrl" placeholder="https://github.com/..." value={formData.githubUrl} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-all shadow-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">LinkedIn URL</label>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><LinkIcon className="w-4 h-4 text-gray-400" /></div>
              <input type="url" name="linkedinUrl" placeholder="https://linkedin.com/in/..." value={formData.linkedinUrl} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-all shadow-sm" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Technical Skills</label>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g. React, Node.js, Python"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700/50 dark:border-gray-600 dark:text-white shadow-sm"
            />
            <button type="button" onClick={addSkill} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-xl hover:scale-105 transition-transform flex items-center">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span key={index} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100 dark:border-blue-800">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resume Document</label>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 transition-colors">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4 font-medium">
              {resume ? 'Resume uploaded successfully' : 'Drag and drop or click to upload'}
            </p>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
            <button type="button" disabled={loading} onClick={() => fileInputRef.current.click()} className="px-6 py-2.5 bg-white border shadow-sm border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> {resume ? 'Replace Resume' : 'Upload File'}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-400 shadow-lg shadow-blue-600/30">
            {loading ? 'Saving Changes...' : 'Save Profile'}
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
