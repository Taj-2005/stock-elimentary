import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_TWELVE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&format=json&apikey=${apiKey}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error('Twelve Data API error response:', text);
      return NextResponse.json({ error: `Twelve Data API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();

    if (data.status === 'error') {
      return NextResponse.json({ error: data.message || 'API error' }, { status: 400 });
    }

    if (!data.values || !Array.isArray(data.values)) {
      return NextResponse.json({ error: 'Invalid data format from API' }, { status: 502 });
    }

    const history = data.values
      .map((point: any) => ({
        date: point.datetime,
        price: parseFloat(point.close),
      }))
      .reverse(); // Oldest first

    return NextResponse.json({ history });
  } catch (error) {
    console.error('API /history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
