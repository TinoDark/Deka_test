'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, StatCard } from '@/components/Card';
import Link from 'next/link';

export default function ResellerWallet() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mobile_money');

  useEffect(() => {
    if (user?.role?.toLowerCase() !== 'reseller') {
      router.push('/login');
    } else {
      loadWalletData();
    }
  }, [user, router]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      }

      const withdrawalsResponse = await fetch('/api/payouts/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawals(withdrawalsData.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > (wallet?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }

    setWithdrawing(true);

    try {
      const response = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
          recipientPhone,
        }),
      });

      if (response.ok) {
        setWithdrawAmount('');
        setRecipientPhone('');
        await loadWalletData();
        alert('Withdrawal request submitted successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit withdrawal request');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet & Payouts</h1>
            <p className="text-gray-600 mt-2">Manage your earnings and withdrawals</p>
          </div>
          <Link
            href="/resellers/dashboard"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Current Balance"
            value={`${wallet?.balance?.toLocaleString() || 0} XAF`}
            icon=""
            color="green"
          />
          <StatCard
            label="Total Earned"
            value={`${wallet?.totalEarned?.toLocaleString() || 0} XAF`}
            icon=""
            color="blue"
          />
          <StatCard
            label="Total Withdrawn"
            value={`${wallet?.totalWithdrawn?.toLocaleString() || 0} XAF`}
            icon=""
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Withdrawal Form */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Withdrawal</h2>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (XAF)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    step="100"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {wallet?.balance?.toLocaleString() || 0} XAF
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Withdrawal Method
                  </label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="wallet">Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Phone (for Mobile Money)
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={withdrawing || !withdrawAmount}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </form>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Withdrawals are processed within 24-48 hours. You must have KYC approved
                  to withdraw funds.
                </p>
              </div>
            </Card>
          </div>

          {/* Withdrawal History */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdrawal History</h2>

              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No withdrawals yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {withdrawal.amount.toLocaleString()} XAF
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {withdrawal.method}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                withdrawal.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : withdrawal.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {withdrawal.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
