import { NextResponse } from 'next/server';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

export async function GET() {
  const promptText = `
  You are a financial assistant. List 10 popular or trending Indian stock symbols that retail investors are currently interested in. 
  Return only the stock symbols in valid Finnhub-compatible format — use ".NS" for NSE stocks or ".BO" for BSE stocks.
  Return only a JSON array like ["RELIANCE.NS", "TCS.NS", "INFY.NS", ...] with no explanation or extra text.
  `;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API Error:', err);
      return NextResponse.json({ error: 'Failed to fetch popular stocks' }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON array from the text response
    const match = raw.match(/\[.*\]/);
    const parsed = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ stocks: parsed }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/popular-stocks:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
