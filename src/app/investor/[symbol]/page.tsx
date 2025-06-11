'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function InvestorSymbolPage() {
  const params = useParams();
  const symbol = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;
  const router = useRouter();

  interface Profile {
    name: string;
    logo: string;
    industry: string;
    website: string;
  }
  useEffect(() => {
  console.log('Current symbol param:', symbol);
}, [symbol]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [geminiSummary, setGeminiSummary] = useState(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const refetchAddedStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAdded(false);
      return;
    }
    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setAdded(data.stocks?.includes(symbol));
    } catch (err) {
      console.error('Failed to fetch portfolio status:', err);
      setAdded(false);
    }
  };


  useEffect(() => {
    if (symbol) {
      refetchAddedStatus();
    }
  }, [symbol]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockSymbol: symbol }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Stock added to portfolio!');
      } else {
        toast.error(data.error || 'Failed to add stock');
      }

      await refetchAddedStatus();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Something went wrong while adding.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockSymbol: symbol }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Stock removed from portfolio!');
      } else {
        toast.error(data.error || 'Failed to remove stock');
      }

      await refetchAddedStatus();
    } catch (error) {
      console.error('Error removing stock:', error);
      toast.error('Something went wrong while removing.');
    } finally {
      setLoading(false);
    }
  };

  const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  useEffect(() => {
    if (!symbol) return;

    // Fetch profile
    (async () => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`
        );
        const data = await res.json();
        setProfile({
          name: data.name || symbol,
          logo: data.logo || '',
          industry: data.finnhubIndustry || '',
          website: data.weburl || '',
        });
      } catch {
        setProfile(null);
      }
    })();

    // Fetch history
    (async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetch(`/api/history?symbol=${symbol}`);
        if (!res.ok) throw new Error('Failed to fetch history data');
        const data = await res.json();
        setHistory(data.history || []);
      } catch {
        setHistoryError('Failed to load history data.');
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    })();

    // Fetch Gemini summary
    (async () => {
      setGeminiLoading(true);
      setGeminiError(null);
      try {
        const res = await fetch('/api/gemini-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        });
        if (!res.ok) throw new Error('Failed to fetch AI summary');
        const data = await res.json();
        setGeminiSummary(data.summary);
      } catch {
        setGeminiError('Could not load AI summary.');
        setGeminiSummary(null);
      } finally {
        setGeminiLoading(false);
      }
    })();
  }, [symbol, token]);

  return (
    <div className="min-h-screen min-w-screen bg-gray-50 p-15 mx-auto">
      <button
        className="mb-4 text-sm text-blue-600 underline"
        onClick={() => router.push('/investor')}
      >
        ← Back to list
      </button>

      <div className="flex items-center gap-6 mb-6">
        {profile?.logo && (
          <img
            src={profile.logo}
            alt={profile.name}
            className="w-20 h-20 object-contain rounded"
          />
        )}

        <div>
          <h2 className="text-black text-3xl font-semibold">
            {profile?.name || symbol}
          </h2>
          {profile?.industry && (
            <p className="text-gray-600">{profile.industry}</p>
          )}
          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Visit website
            </a>
          )}
        </div>
      </div>

      {historyLoading ? (
        <p className="text-gray-600">Loading historical data...</p>
      ) : historyError ? (
        <p className="text-red-500">{historyError}</p>
      ) : history.length === 0 ? (
        <p className="text-gray-500">No historical data available.</p>
      ) : (
        <ResponsiveContainer className="text-black" width="100%" height={300}>
          <LineChart
            data={history}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(date) => date.slice(5)}
              tick={{ fontSize: 12, fill: '#4B5563' }}
            />
            <YAxis
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12, fill: '#4B5563' }}
              width={60}
              tickFormatter={(value) =>
                typeof value === 'number' ? `$${value.toFixed(2)}` : value
              }
            />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? `$${value.toFixed(2)}` : value
              }
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563EB"
              strokeWidth={3}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-8 text-gray-700">
        <h3 className="text-xl font-semibold mb-2">
          AI-Generated Investment Summary
        </h3>

        {geminiLoading ? (
          <p className="text-gray-500">Generating summary...</p>
        ) : geminiError ? (
          <p className="text-red-500">{geminiError}</p>
        ) : geminiSummary ? (
          <p>{geminiSummary}</p>
        ) : (
          <p>
            This section can contain a short summary or research info about{' '}
            {symbol}.
          </p>
        )}
      </div>

      {added ? (
        <button
          onClick={handleRemove}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50 mt-6"
        >
          {loading ? 'Removing...' : 'Remove from Portfolio'}
        </button>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 mt-6"
        >
          {loading ? 'Adding...' : 'Add to Portfolio'}
        </button>
      )}
    </div>
  );
}
