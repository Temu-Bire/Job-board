import mongoose from 'mongoose';

const jobSchema = mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String, // Full-time, Internship, etc.
      required: true,
    },
    category: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [String],
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    openings: { type: Number, default: 1 },
    applicationStart: { type: Date, default: null },
    applicationEnd: { type: Date, default: null },
    contactEmail: { type: String, default: '' },
    contactWebsite: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'open', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
