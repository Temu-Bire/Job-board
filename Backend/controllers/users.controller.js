import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import { buildStoredUploadUrl } from '../utils/mediaPath.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
};

async function persistBinaryUpload(req, folder) {
  if (!req.file) return null;
  if (req.file.buffer && isCloudinaryConfigured()) {
    return uploadBufferToCloudinary(req.file.buffer, { folder });
  }
  if (req.file.filename) {
    return buildStoredUploadUrl(req.file.filename);
  }
  return null;
}

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(
      users.map((u) => ({
        ...u.toObject(),
        // keep old frontend expectation: these are top-level
        avatarUrl: u.avatarUrl || u.profile?.avatarUrl || '',
        resumeUrl: u.resumeUrl || u.profile?.resumeUrl || '',
        university: u.university || u.profile?.university || '',
        degree: u.degree || u.profile?.degree || '',
        graduationYear: u.graduationYear || u.profile?.graduationYear || null,
        githubUrl: u.githubUrl || u.profile?.githubUrl || '',
        linkedinUrl: u.linkedinUrl || u.profile?.linkedinUrl || '',
        company: u.company || u.profile?.companyName || '',
        logoUrl: u.logoUrl || u.profile?.logoUrl || '',
        skills: u.profile?.skills || [],
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserBasic = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name ?? user.name;
    user.email = req.body.email ?? user.email;

    const saved = await user.save();
    res.json({ _id: saved._id, name: saved.name, email: saved.email });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateJobseekerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profilePatch = {
      university: req.body.university ?? user.profile?.university,
      degree: req.body.degree ?? user.profile?.degree,
      graduationYear: req.body.graduationYear ?? user.profile?.graduationYear,
      skills: Array.isArray(req.body.skills) ? req.body.skills : user.profile?.skills,
      resumeUrl: req.body.resumeUrl ?? user.profile?.resumeUrl,
      phone: req.body.phone ?? user.profile?.phone,
      githubUrl: req.body.githubUrl ?? user.profile?.githubUrl,
      linkedinUrl: req.body.linkedinUrl ?? user.profile?.linkedinUrl,
      avatarUrl: req.body.avatarUrl ?? user.profile?.avatarUrl,
    };

    user.profile = { ...(user.profile || {}), ...profilePatch };
    user.university = profilePatch.university || user.university;
    user.degree = profilePatch.degree || user.degree;
    user.graduationYear = profilePatch.graduationYear ?? user.graduationYear;
    user.phone = profilePatch.phone || user.phone;
    user.githubUrl = profilePatch.githubUrl || user.githubUrl;
    user.linkedinUrl = profilePatch.linkedinUrl || user.linkedinUrl;
    user.avatarUrl = profilePatch.avatarUrl || user.avatarUrl;
    user.resumeUrl = profilePatch.resumeUrl || user.resumeUrl;

    const saved = await user.save();
    res.json(saved.profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const approveRecruiter = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'recruiter') return res.status(400).json({ message: 'Only recruiters can be approved' });
    user.approved = true;
    const saved = await user.save();

    // Send notification to the recruiter
    await Notification.create({
      userId: user._id,
      type: 'recruiter_approved',
      message: 'Your recruiter account has been approved by an administrator! You can now post jobs.'
    });

    res.json({ success: true, approved: saved.approved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin users cannot be blocked' });
    }
    user.blocked = true;
    const saved = await user.save();
    res.json({ success: true, blocked: saved.blocked });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Admin reset a user's password
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
export const resetUserPassword = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const { password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password;
    await user.save(); // hashes via pre('save')

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadJobseekerAvatar = async (req, res) => {
  try {
    ensureUploadsDir();
    const { id } = req.params;
    if (req.user._id.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const avatarUrl = await persistBinaryUpload(req, 'careerconnect/avatars');
    if (!avatarUrl) return res.status(500).json({ message: 'Could not store file' });
    user.profile = { ...(user.profile || {}), avatarUrl };
    user.avatarUrl = avatarUrl;
    const saved = await user.save();

    res.json({ avatarUrl, profile: saved.profile });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadJobseekerResume = async (req, res) => {
  try {
    ensureUploadsDir();
    const { id } = req.params;
    if (req.user._id.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resumeUrl = await persistBinaryUpload(req, 'careerconnect/resumes');
    if (!resumeUrl) return res.status(500).json({ message: 'Could not store file' });
    user.profile = { ...(user.profile || {}), resumeUrl };
    user.resumeUrl = resumeUrl;
    const saved = await user.save();

    res.json({ resumeUrl, profile: saved.profile });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get saved jobs for current jobseeker
// @route   GET /api/users/saved-jobs
// @access  Private/Jobseeker
export const getSavedJobs = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id).select('savedJobs');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const jobs = await Job.find({ _id: { $in: user.savedJobs } })
      .sort({ createdAt: -1 })
      .populate('recruiterId', 'name profile');

    res.json(jobs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRecruiterProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profilePatch = {
      companyName: req.body.companyName ?? user.profile?.companyName,
      location: req.body.location ?? user.profile?.location,
      phone: req.body.phone ?? user.profile?.phone,
    };

    user.profile = { ...(user.profile || {}), ...profilePatch };
    user.company = profilePatch.companyName || user.company;
    user.companyDescription = req.body.companyDescription ?? user.companyDescription;
    user.website = req.body.website ?? user.website;
    user.phone = profilePatch.phone ?? user.phone;

    const saved = await user.save();
    res.json(saved.profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadRecruiterLogo = async (req, res) => {
  try {
    ensureUploadsDir();
    const { id } = req.params;
    if (req.user._id.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const logoUrl = await persistBinaryUpload(req, 'careerconnect/logos');
    if (!logoUrl) return res.status(500).json({ message: 'Could not store file' });
    user.profile = { ...(user.profile || {}), logoUrl };
    user.logoUrl = logoUrl;
    const saved = await user.save();

    res.json({ logoUrl, profile: saved.profile });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      approved: true,
      blocked: false,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (req.user._id.toString() !== id.toString()) {
      return res.status(403).json({ message: 'Not authorized to change this password' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!(await user.matchPassword(oldPassword))) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

