import { NextRequest, NextResponse } from 'next/server';
import { getUserPortfolioStocks } from '@/lib/mogodb'; // your function to fetch stocks by email

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    const stocks = await getUserPortfolioStocks(email);
    return NextResponse.json({ stocks }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
