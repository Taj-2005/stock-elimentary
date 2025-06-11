'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Stock {
  symbol: string;
  price: number | null;
  recommendation?: string;
}

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA'];

export default function InvestorPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  const fetchPrice = async (symbol: string): Promise<number | null> => {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`
      );
      const json = await res.json();
      return typeof json.c === 'number' && json.c > 0 ? json.c : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const prices = await Promise.all(
          SYMBOLS.map(async (symbol) => ({
            symbol,
            price: await fetchPrice(symbol),
          }))
        );

        const validStocks = prices.filter((s) => s.price !== null);

        const recRes = await fetch('/api/recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stocks: validStocks }),
        });

        if (!recRes.ok) throw new Error('Failed to fetch recommendations');

        const recJson = await recRes.json();
        const recResults: Stock[] = recJson.results || [];

        const mergedStocks: Stock[] = validStocks.map(({ symbol, price }) => {
          const recObj = recResults.find((r) => r.symbol === symbol);
          return {
            symbol,
            price,
            recommendation: recObj ? recObj.recommendation : 'HOLD',
          };
        });

        setStocks(mergedStocks);
      } catch (error) {
        console.error('Error loading stocks or recommendations:', error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
        <div className='min-w-screen flex flex-row justify-end bg-gray-50 p-5'>
            <button
                onClick={() => signOut()}
                className="flex py-2 px-4 items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-md shadow transition-colors duration-200"
            > 
                <span>Logout</span>
                <LogOut className="w-5 h-5" />
            </button>
        </div>
        <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-semibold text-gray-800 mb-10 tracking-tight">
            Investor Dashboard
            </h1>
            <button
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => router.push('/investor/portfolio')}
            >
            📁 View My Portfolio
            </button>

            {loading ? (
            <p className="text-gray-500 text-lg">Loading stock data & recommendations...</p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stocks.map(({ symbol, price, recommendation }) => (
                <div
                    key={symbol}
                    onClick={() => router.push(`/investor/${symbol}`)}
                    className="cursor-pointer bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
                    title="Click for details"
                >
                    <div>
                    <h2 className="text-2xl font-medium text-gray-800 mb-2">{symbol}</h2>
                    <p className="text-gray-600 mb-1">
                        Price: {price !== null ? `$${price.toFixed(2)}` : 'N/A'}
                    </p>
                    </div>
                    <div className="mt-4">
                    <span
                        className={`inline-block text-sm font-semibold px-4 py-1 rounded-full ${
                        recommendation === 'BUY'
                            ? 'bg-green-100 text-green-700'
                            : recommendation === 'SELL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                        {recommendation}
                    </span>
                    </div>
                </div>
                ))}
            </div>
            )}

        </div>
        </div>
    </>
  );
}
