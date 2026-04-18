import Contact from '../models/Contact.js';
import { sendContactEmailWithRetry } from '../services/email.service.js';
import { contactSchema } from '../validators/contact.validators.js';

export const handleContactForm = async (req, res) => {
  try {
    // 1. Zod Input Validation
    const validationResult = contactSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationResult.error.errors 
      });
    }

    const { name, email, subject, message } = validationResult.data;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) {
      return res.status(500).json({ success: false, message: 'Admin email destination is not configured.' });
    }

    // 2. Initial DB Save
    const newContactMessage = new Contact({
      name,
      email,
      subject,
      message,
      status: 'pending'
    });
    
    await newContactMessage.save();

    // 3. Email Send attempt via Service Layer
    const emailData = {
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    };

    try {
      const result = await sendContactEmailWithRetry(emailData, 3);
      
      if (result.skipped) {
        newContactMessage.status = 'failed';
        newContactMessage.errorDetails = 'SMTP environment variables unconfigured';
        await newContactMessage.save();
        return res.status(500).json({ success: false, message: 'Email SMTP credentials missing on server.' });
      }

      // Success
      newContactMessage.status = 'sent';
      await newContactMessage.save();
      return res.status(200).json({ success: true, message: 'Message sent successfully.' });

    } catch (emailError) {
      console.error('[Contact Controller] Email failed after retries:', emailError);
      newContactMessage.status = 'failed';
      newContactMessage.errorDetails = emailError.message;
      await newContactMessage.save();
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send message. Please try again later.', 
        error: emailError.message 
      });
    }

  } catch (error) {
    console.error('Contact Form General Error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.', error: error.message });
  }
};
