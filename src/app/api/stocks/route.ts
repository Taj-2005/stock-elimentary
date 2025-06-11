import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '';

const symbols = ['AAPL', 'GOOGL', 'MSFT']; // Keep small for testing

async function fetchPrice(symbol: string): Promise<string> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);

  const data = await res.json();

  if (data.Note) {
    throw new Error('Alpha Vantage API rate limit exceeded. Please wait.');
  }

  const price = data['Global Quote']?.['05. price'];
  return price ? parseFloat(price).toFixed(2) : 'N/A';
}

export async function GET() {
  try {
    const stockData: Record<string, string> = {};

    for (const symbol of symbols) {
      stockData[symbol] = await fetchPrice(symbol);
      // Wait 15 seconds between calls to avoid rate limits (Alpha Vantage free tier)
      await new Promise((r) => setTimeout(r, 15000));
    }

    return NextResponse.json({ stockData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
