import { NextResponse } from 'next/server';

interface Stock {
  symbol: string;
  price: number;
}

export async function POST(req: Request) {
  try {
    const { stocks } = await req.json(); // Expecting { stocks: Stock[] }
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json(
        { error: 'stocks array is required in the body' },
        { status: 400 }
      );
    }

    // Build one prompt with all stocks for batch recommendation
    const prompt = stocks
      .map(
        ({ symbol, price }) =>
          `You are a financial advisor. Given the stock symbol "${symbol}" and its current price $${price.toFixed(
            2
          )}, respond with exactly one word: BUY, HOLD, or SELL.`
      )
      .join('\n');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const json = await res.json();

    // Extract raw text from Gemini response
    const rawText =
      json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Expecting Gemini to respond with one recommendation per stock, separated by newlines
    const lines: string[] = rawText
      .split('\n')
      .map((line: string) => line.trim().toUpperCase())
      .filter((line: string) => ['BUY', 'HOLD', 'SELL'].includes(line));

    // Map each stock to the corresponding recommendation, fallback to HOLD
    const results = stocks.map((stock, idx) => ({
      symbol: stock.symbol,
      price: stock.price,
      recommendation: lines[idx] || 'HOLD',
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Gemini batch recommendation error:', err);
    return NextResponse.json(
      { error: 'Failed to get batch recommendations from Gemini' },
      { status: 500 }
    );
  }
}
