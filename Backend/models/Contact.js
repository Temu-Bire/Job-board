import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  errorDetails: { type: String, default: null }
}, { timestamps: true });

const Contact = mongoose.model('Contact', ContactSchema);
export default Contact;
