import { Portfolio } from '@/models/Portfolio';
import mongoose from 'mongoose';

export async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(MONGODB_URI);
}

export async function getUserPortfolioStocks(userEmail: string): Promise<string[]> {
  await dbConnect();

  const portfolio = await Portfolio.findOne({ userEmail }).lean();
  if (!portfolio || !('stocks' in portfolio)) return [];
  return portfolio.stocks as string[];
}