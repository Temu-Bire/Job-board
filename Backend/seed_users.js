import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is extremely required');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    // Pre-defined dummy users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@careerconnect.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'Jobseeker User',
        email: 'jobseeker@careerconnect.com',
        password: 'student123',
        role: 'jobseeker',
      },
      {
        name: 'Recruiter User',
        email: 'recruiter@careerconnect.com',
        password: 'recruiter123',
        role: 'recruiter',
      },
    ];

    console.log('Clearing existing seed users (if any)...');
    for (const user of users) {
      await User.deleteOne({ email: user.email });
    }

    console.log('Inserting seed users...');
    for (const user of users) {
      await User.create(user);
      console.log(`Created user: ${user.name} (${user.email}) | Role: ${user.role} | Password: ${user.password}`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedUsers();
