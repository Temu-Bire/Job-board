import User from '../models/User.js';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      email: rawEmail,
      password,
      role,
      university,
      degree,
      graduationYear,
      company,
      companyDescription,
      website,
    } = req.body;

    const email = String(rawEmail || '').trim().toLowerCase();

    const userExists = await User.findOne({
      $expr: { $eq: [{ $toLower: '$email' }, email] },
    });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'jobseeker',
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
      },
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
    const { email: rawEmail, password } = req.body;
    const email = String(rawEmail || '').trim().toLowerCase();

    const user = await User.findOne({
      $expr: { $eq: [{ $toLower: '$email' }, email] },
    });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.blocked && user.role !== 'admin') {
      return res.status(403).json({
        message: 'This account has been suspended. If you think this is a mistake, contact support.',
      });
    }

    if (!(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    return res.json({
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
  } catch (error) {
    if (res.headersSent) return;
    const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 401;
    res.status(status).json({ message: error.message || 'Login failed' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Request password reset (email link)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    // Always respond with success to prevent user enumeration
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    const rawToken = user.createPasswordResetToken();
    await user.save();

    const frontendBase = process.env.FRONTEND_URL || 'https://job-board-5so6.vercel.app';
    const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const subject = 'Reset your CareerConnect password';
    const text = `You requested a password reset.\n\nReset link: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`;
    const html = `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `;

    const sent = await sendEmail({ to: user.email, subject, text, html });

    if (sent?.skipped) {
      // Helpful for local/dev when SMTP isn't configured
      // eslint-disable-next-line no-console
      console.log(`[forgot-password] SMTP not configured. Reset URL for ${user.email}: ${resetUrl}`);
    }

    return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    // Auto-login after reset
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
      blocked: user.blocked,
      profile: user.profile,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body;

    // Verify token with google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = String(payload.email || '').trim().toLowerCase();
    const name = payload.name;
    const avatarUrl = payload.picture;

    let user = await User.findOne({
      $expr: { $eq: [{ $toLower: '$email' }, email] },
    });

    if (!user) {
      // Register logic
      const assignedRole = role || 'jobseeker';
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(20).toString('hex'), // random password for OAuth users
        role: assignedRole,
        approved: assignedRole === 'recruiter' ? false : true,
        blocked: false,
        avatarUrl,
        profile: {
          avatarUrl
        }
      });

      // Notify admins
      const admins = await User.find({ role: 'admin', blocked: { $ne: true } }).select('_id');
      if (admins.length > 0) {
        const notifications = admins.map((a) => ({
          userId: a._id,
          type: 'new_user_registered',
          message: `New user registered via Google: ${user.name} (${user.email}).`,
        }));
        await Notification.insertMany(notifications);
      }
    }

    if (user.blocked && user.role !== 'admin') {
      return res.status(403).json({
        message: 'This account has been suspended. If you think this is a mistake, contact support.',
      });
    }

    // Login user (whether just created or existing)
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
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid or expired Google token' });
  }
};
