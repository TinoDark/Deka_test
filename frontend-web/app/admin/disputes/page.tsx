'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card } from '@/components/Card';
import Link from 'next/link';

export default function AdminDisputes() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'open' | 'resolved' | 'closed'>('open');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== 'admin') {
      router.push('/login');
    } else {
      loadDisputes();
    }
  }, [user, router, filter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/disputes?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string) => {
    if (!resolution) {
      setError('Please enter a resolution');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        await loadDisputes();
        setSelectedDispute(null);
        setResolution('');
      } else {
        setError('Failed to resolve dispute');
      }
    } catch (err: any) {
      setError(err.message || 'Error resolving dispute');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading disputes...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Disputes Management</h1>
            <p className="text-gray-600 mt-2">Manage customer disputes and grievances</p>
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

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8">
          {(['open', 'resolved', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 font-medium rounded-lg transition capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">No disputes found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition"
                onClick={() => setSelectedDispute(dispute)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{dispute.title}</h3>
                    <p className="text-gray-600 mt-1">{dispute.description}</p>
                    <div className="mt-4 flex gap-4 text-sm">
                      <span className="text-gray-500">
                        Order: <span className="font-semibold">{dispute.orderId}</span>
                      </span>
                      <span className="text-gray-500">
                        Reported by: <span className="font-semibold">{dispute.reportedBy}</span>
                      </span>
                      <span className="text-gray-500">
                        Date: <span className="font-semibold">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        dispute.status === 'OPEN'
                          ? 'bg-red-100 text-red-800'
                          : dispute.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dispute.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-2">Priority: {dispute.priority}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dispute Detail Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDispute.title}</h2>
                  <p className="text-gray-600 mt-1">ID: {selectedDispute.id}</p>
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase">Description</p>
                  <p className="text-gray-900 mt-1">{selectedDispute.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase">Status</p>
                    <p className="text-gray-900 mt-1 capitalize">{selectedDispute.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase">Priority</p>
                    <p className="text-gray-900 mt-1 capitalize">{selectedDispute.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase">Order ID</p>
                    <p className="text-gray-900 mt-1">{selectedDispute.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase">Reported By</p>
                    <p className="text-gray-900 mt-1">{selectedDispute.reportedBy}</p>
                  </div>
                </div>

                {selectedDispute.resolution && (
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase">Resolution</p>
                    <p className="text-gray-900 mt-1">{selectedDispute.resolution}</p>
                  </div>
                )}
              </div>

              {/* Resolution Form */}
              {selectedDispute.status === 'OPEN' && (
                <div className="pt-6 border-t">
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter resolution details..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={4}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleResolve(selectedDispute.id)}
                      disabled={actionLoading || !resolution}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => setSelectedDispute(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
