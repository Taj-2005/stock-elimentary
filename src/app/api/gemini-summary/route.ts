import { NextResponse } from 'next/server';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

export async function POST(request: Request) {
  try {
    const { symbol } = await request.json();

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid symbol' }, { status: 400 });
    }

const promptText = `
You are a financial analyst. Provide a concise, professional investment summary for the stock symbol ${symbol}. 
Include the following:
- Recent price trends and key recent events impacting the stock
- A reasoned price outlook for the next 1 month with possible risks
- Clear buy, hold, or sell recommendation with rationale
- Suggested portfolio allocation percentage based on risk profile
Use precise language, avoid jargon, and keep it engaging for investors seeking actionable insights.
`;


    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    const rawSummary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!rawSummary) {
      return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
    }

    // Clean up markdown: remove ##, **, #, etc.
    const cleanedSummary = rawSummary
      .replace(/^##\s*/gm, '')  // remove markdown H2 headers
      .replace(/\*\*/g, '')     // remove bold **
      .replace(/^\s*#+\s*/gm, '') // remove any other markdown headers (#, ##, ###)
      .trim();

    return NextResponse.json({ summary: cleanedSummary }, { status: 200 });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
