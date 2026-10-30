import mongoose from 'mongoose';
import { DB_URI } from '../config.js';
export async function bootstrapDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(DB_URI);
  console.log('MongoDB connected');
}
