'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, StatCard } from '@/components/Card';
import Link from 'next/link';

export default function AdminRefunds() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== 'admin') {
      router.push('/login');
    } else {
      loadRefunds();
    }
  }, [user, router]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/refunds', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRefunds(data.data || []);
        setStats(data.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!orderId || !amount || !reason) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          orderId,
          amount: parseFloat(amount),
          reason,
        }),
      });

      if (response.ok) {
        setOrderId('');
        setAmount('');
        setReason('');
        await loadRefunds();
        alert('Refund created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create refund');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating refund');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading refunds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Refunds Management</h1>
            <p className="text-gray-600 mt-2">Process manual refunds and view history</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Back
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="Total Refunded"
              value={`${stats.totalRefunded?.toLocaleString() || 0} XAF`}
              icon=""
              color="red"
            />
            <StatCard
              label="Pending Refunds"
              value={stats.pendingCount || 0}
              icon=""
              color="yellow"
            />
            <StatCard
              label="Completed Refunds"
              value={stats.completedCount || 0}
              icon=""
              color="green"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Refund Form */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Refund</h2>

              <form onSubmit={handleSubmitRefund} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter order ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount (XAF)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    step="100"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for refund"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Create Refund'}
                </button>
              </form>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Ensure the order exists and the amount is correct before processing.
                </p>
              </div>
            </Card>
          </div>

          {/* Refunds History */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund History</h2>

              {refunds.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No refunds processed yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((refund) => (
                        <tr key={refund.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                            {refund.orderId}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {refund.amount.toLocaleString()} XAF
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {refund.reason}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                refund.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : refund.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {refund.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(refund.createdAt).toLocaleDateString()}
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
