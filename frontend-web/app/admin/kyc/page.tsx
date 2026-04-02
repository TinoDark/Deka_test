'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card } from '@/components/Card';
import Link from 'next/link';

export default function AdminKYCManagement() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedKYC, setSelectedKYC] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== 'admin') {
      router.push('/login');
    } else {
      loadKYCRequests();
    }
  }, [user, router, filter]);

  const loadKYCRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/kyc?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKycRequests(data.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId: string) => {
    if (!window.confirm('Approve this KYC request?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/kyc/${kycId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        await loadKYCRequests();
        setSelectedKYC(null);
      } else {
        setError('Failed to approve KYC');
      }
    } catch (err: any) {
      setError(err.message || 'Error approving KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (kycId: string, reason: string) => {
    if (!reason) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/kyc/${kycId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await loadKYCRequests();
        setSelectedKYC(null);
      } else {
        setError('Failed to reject KYC');
      }
    } catch (err: any) {
      setError(err.message || 'Error rejecting KYC');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading KYC requests...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
            <p className="text-gray-600 mt-2">Review and approve user KYC documents</p>
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
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
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

        {/* KYC Requests Table */}
        {kycRequests.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">No KYC requests found</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kycRequests.map((kyc) => (
                    <tr
                      key={kyc.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedKYC(kyc)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">{kyc.user?.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                        {kyc.user?.role?.toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {kyc.data?.fullName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(kyc.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            kyc.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : kyc.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {kyc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKYC(kyc);
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* KYC Detail Modal */}
        {selectedKYC && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">KYC Details</h2>
                  <p className="text-gray-600 mt-1">{selectedKYC.user?.email}</p>
                </div>
                <button
                  onClick={() => setSelectedKYC(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* KYC Data Display */}
              <div className="space-y-4 mb-6">
                {Object.entries(selectedKYC.data || {})
                  .filter(([key]) => key !== 'document')
                  .map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500 uppercase font-semibold">{key}</p>
                      <p className="text-gray-900 mt-1">{String(value) || 'N/A'}</p>
                    </div>
                  ))}
              </div>

              {/* Actions */}
              {selectedKYC.status === 'PENDING' && (
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={() => handleApprove(selectedKYC.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason) {
                        handleReject(selectedKYC.id, reason);
                      }
                    }}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
