import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['jobseeker', 'recruiter', 'admin'],
      default: 'jobseeker',
    },
    approved: {
      type: Boolean,
      default: function () {
        return this.role === 'recruiter' ? false : true;
      },
    },
    blocked: {
      type: Boolean,
      default: false,
    },

    // Flattened profile fields (UI reads these at top-level in some places)
    university: { type: String, default: '' },
    degree: { type: String, default: '' },
    graduationYear: { type: Number, default: null },
    phone: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },

    // Recruiter/company fields
    company: { type: String, default: '' },
    companyDescription: { type: String, default: '' },
    website: { type: String, default: '' },
    logoUrl: { type: String, default: '' },

    profile: {
      avatarUrl: String,
      bio: String,
      skills: [String],
      resumeUrl: String,
      logoUrl: String, // For recruiters
      companyName: String, // For recruiters
      location: String,
      university: String,
      degree: String,
      graduationYear: Number,
      phone: String,
      githubUrl: String,
      linkedinUrl: String,
    },

    // Job bookmarking for jobseekers
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordTokenHash = tokenHash;
  this.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

const User = mongoose.model('User', userSchema);

export default User;
