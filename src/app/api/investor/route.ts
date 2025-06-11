import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
import { dbConnect } from '@/lib/mogodb';
import User from '@/models/User';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Login required' });
  }

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role !== 'investor') return res.status(403).json({ error: 'Only investors allowed' });

  const { method } = req;

  switch (method) {
    case 'GET':
      return res.status(200).json({ stocks: user.investorPortfolio });

    case 'POST': {
      const { symbol } = req.body;
      if (!symbol) return res.status(400).json({ error: 'Symbol required' });

      if (!user.investorPortfolio.includes(symbol)) {
        user.investorPortfolio.push(symbol);
        await user.save();
      }
      return res.status(201).json({ added: symbol });
    }

    case 'DELETE': {
      const { symbol } = req.body;
      user.investorPortfolio = user.investorPortfolio.filter((s: any) => s !== symbol);
      await user.save();
      return res.status(200).json({ removed: symbol });
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
