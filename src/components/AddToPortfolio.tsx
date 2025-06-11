'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface AddToPortfolioButtonProps {
  stockSymbol: string;
}

export default function AddToPortfolioButton({ stockSymbol }: AddToPortfolioButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stockSymbol })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Stock added to portfolio!');
      } else {
        toast.error(data.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {loading ? 'Adding...' : 'Add to Portfolio'}
    </button>
  );
}
