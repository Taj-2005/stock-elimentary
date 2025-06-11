'use client';

import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  logo: string;
  name: string;
}

type SortKey = 'name' | 'price' | 'change';

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<StockData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [addingSymbol, setAddingSymbol] = useState('');
  const [processingAddRemove, setProcessingAddRemove] = useState(false);

  const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY!;

  // Fetch detailed stock info from Finnhub for given symbols
  const fetchStockData = async (symbols: string[]) => {
    if (symbols.length === 0) {
      setStocks([]);
      setLoading(false);
      return;
    }
    try {
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const profile = await profileRes.json();
          const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const quote = await quoteRes.json();

          return {
            symbol,
            price: quote.c || 0,
            change: quote.dp || 0,
            logo: profile.logo || '',
            name: profile.name || symbol,
          };
        })
      );
      setStocks(results);
    } catch {
      toast.error('Failed to load stock data');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommended stocks
  const fetchRecommendations = async () => {
    const recommendedSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
    try {
      const results = await Promise.all(
        recommendedSymbols.map(async (symbol) => {
          const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const profile = await profileRes.json();
          const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const quote = await quoteRes.json();

          return {
            symbol,
            price: quote.c || 0,
            change: quote.dp || 0,
            logo: profile.logo || '',
            name: profile.name || symbol,
          };
        })
      );
      setRecommendations(results);
    } catch {
      toast.error('Failed to load recommendations');
      setRecommendations([]);
    }
  };

  // Load portfolio from your API using the email cookie
  const loadUserPortfolio = async () => {
    setLoading(true);
    try {
      const email = getCookie('email');
      if (!email) throw new Error('Email not found in cookies');

      const res = await fetch(`/api/getstocks?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Portfolio fetch failed');
      const data = await res.json();

      if (Array.isArray(data.stocks)) {
        await fetchStockData(data.stocks);
      } else {
        setStocks([]);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Could not fetch your portfolio.');
      setStocks([]);
      setLoading(false);
    }
  };

  // Add stock symbol to portfolio
  const handleAddStock = async () => {
    if (!addingSymbol.trim()) return;
    setProcessingAddRemove(true);

    try {
      const email = getCookie('email');
      if (!email) throw new Error('Email not found in cookies');

      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockSymbol: addingSymbol.trim().toUpperCase(), email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${addingSymbol.trim().toUpperCase()} added!`);
        loadUserPortfolio(); // Reload portfolio after adding
        setAddingSymbol('');
      } else {
        toast.error(data.error || 'Add failed');
      }
    } catch {
      toast.error('Error adding stock');
    } finally {
      setProcessingAddRemove(false);
    }
  };

  // Remove stock symbol from portfolio
  const handleRemoveStock = async (symbol: string) => {
    setProcessingAddRemove(true);

    try {
      const email = getCookie('email');
      if (!email) throw new Error('Email not found in cookies');

      const res = await fetch('/api/portfolio', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockSymbol: symbol, email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${symbol} removed!`);
        loadUserPortfolio(); // Reload portfolio after removal
      } else {
        toast.error(data.error || 'Remove failed');
      }
    } catch {
      toast.error('Error removing stock');
    } finally {
      setProcessingAddRemove(false);
    }
  };

  useEffect(() => {
    loadUserPortfolio();
    fetchRecommendations();
  }, []);

  const filteredStocks = useMemo(() => {
    let filtered = stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortKey) {
      case 'price':
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case 'change':
        filtered = filtered.sort((a, b) => b.change - a.change);
        break;
      case 'name':
      default:
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [stocks, searchTerm, sortKey]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Your Portfolio</h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Add stock symbol (e.g., AAPL)"
          className="flex-grow border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={addingSymbol}
          onChange={(e) => setAddingSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
          disabled={processingAddRemove}
        />
        <button
          onClick={handleAddStock}
          disabled={processingAddRemove || !addingSymbol.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {processingAddRemove ? 'Adding...' : 'Add'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <input
          type="text"
          placeholder="Search stocks..."
          className="text-black border border-gray-300 rounded px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="change">Sort by Change %</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading your stocks...</p>
      ) : filteredStocks.length === 0 ? (
        <p className="text-gray-500">No stocks found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {filteredStocks.map(({ symbol, price, logo, name, change }) => (
            <div
              key={symbol}
              className="flex items-center p-4 border rounded hover:shadow-lg transition-shadow"
            >
              {logo ? (
                <img src={logo} alt={name} className="w-12 h-12 object-contain mr-4" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded mr-4 text-gray-400 font-semibold">
                  {symbol[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-lg text-gray-800">{name}</p>
                <p className="text-gray-600">{symbol}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bold text-green-600 text-xl">${price.toFixed(2)}</p>
                <p
                  className={`text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </p>
              </div>
              <button
                disabled={processingAddRemove}
                onClick={() => handleRemoveStock(symbol)}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Recommended for you</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommendations.map(({ symbol, price, logo, name, change }) => (
            <div
              key={symbol}
              className="flex items-center p-3 border rounded hover:shadow-md cursor-pointer"
              onClick={() => window.open(`/investor/${symbol}`, '_blank')}
            >
              {logo ? (
                <img src={logo} alt={name} className="w-10 h-10 object-contain mr-3" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded mr-3 text-gray-400 font-semibold">
                  {symbol[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-700">{name}</p>
                <p className="text-sm text-gray-500">{symbol}</p>
              </div>
              <div className={`ml-auto font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${price.toFixed(2)} ({change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
