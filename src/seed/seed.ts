import { env } from '../lib/env.js';
import mongoose from 'mongoose';
import Campground from '../models/campground.model.js';
import cities from './cities.js';
import { descriptors, places } from './seedHelpers.js';

const connectDB = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const sample = (array: string[]) =>
  array[Math.floor(Math.random() * array.length)];

const createCampgrounds = async () => {
  for (let i = 0; i < 50; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const camp = new Campground({
      location: `${cities[random1000]?.city}, ${cities[random1000]?.state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description: 'fdf',
      price: random1000,
    });
    await camp.save();
  }
};

const seedDB = async () => {
  await connectDB();

  await Campground.deleteMany({});

  await createCampgrounds();
};

seedDB()
  .then(() => {
    console.log('✅ Seeded database');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  });
