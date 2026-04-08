import User from '../models/User.js';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      university,
      degree,
      graduationYear,
      company,
      companyDescription,
      website,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      approved: role === 'recruiter' ? false : true,
      blocked: false,
      university: university || '',
      degree: degree || '',
      graduationYear: graduationYear ? Number(graduationYear) : null,
      company: company || '',
      companyDescription: companyDescription || '',
      website: website || '',
      profile: {
        university: university || '',
        degree: degree || '',
        graduationYear: graduationYear ? Number(graduationYear) : null,
      }
    });

    if (user) {
      // Notify admins about the new user
      const admins = await User.find({ role: 'admin', blocked: { $ne: true } }).select('_id');
      if (admins.length > 0) {
        const notifications = admins.map((a) => ({
          userId: a._id,
          type: 'new_user_registered',
          message: `New user registered: ${user.name} (${user.email}).`,
        }));
        await Notification.insertMany(notifications);
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
        blocked: user.blocked,
        university: user.university,
        degree: user.degree,
        graduationYear: user.graduationYear,
        company: user.company,
        companyDescription: user.companyDescription,
        website: user.website,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
        blocked: user.blocked,
        university: user.university,
        degree: user.degree,
        graduationYear: user.graduationYear,
        company: user.company,
        companyDescription: user.companyDescription,
        website: user.website,
        avatarUrl: user.avatarUrl,
        resumeUrl: user.resumeUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
