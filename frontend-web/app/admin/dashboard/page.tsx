'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Card, StatCard } from '@/components/Card';
import { AdminService } from '@/lib/services';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, userStatsData, kycData, disputesData] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getUserStats(),
        AdminService.getKYCRequests('pending', 5),
        AdminService.getDisputes('open', 5),
      ]);

      setStats(dashboardStats);
      setUserStats(userStatsData);
      setKycQueue(kycData.data);
      setDisputes(disputesData.data);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Center 🎛️</h1>
          <p className="text-gray-600 mt-2">Platform management and monitoring</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Total Orders"
            value={stats?.totalOrders || 0}
            icon="📋"
            color="blue"
          />
          <StatCard
            label="Total Revenue"
            value={`${(stats?.totalRevenue || 0).toLocaleString()} XAF`}
            icon="💰"
            color="green"
          />
          <StatCard
            label="Active Users"
            value={
              (userStats?.activeSuppliers || 0) +
              (userStats?.activeResellers || 0) +
              (userStats?.activeDelivery || 0)
            }
            icon="👥"
            color="blue"
          />
        </div>

        {/* Critical Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Pending KYC"
            value={stats?.pendingKYC || 0}
            icon="⏳"
            color="yellow"
            trend={
              stats?.pendingKYC > 10
                ? { value: 15, direction: 'up' as const }
                : { value: 5, direction: 'down' as const }
            }
          />
          <StatCard
            label="Open Disputes"
            value={stats?.openDisputes || 0}
            icon="⚠️"
            color="red"
          />
          <StatCard label="Suppliers" value={userStats?.suppliers || 0} icon="🏭" color="blue" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/kyc"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">🆔</span>
            <h3 className="font-semibold text-gray-900 text-sm">KYC Management</h3>
          </Link>

          <Link
            href="/admin/disputes"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">⚖️</span>
            <h3 className="font-semibold text-gray-900 text-sm">Disputes</h3>
          </Link>

          <Link
            href="/admin/refunds"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">💳</span>
            <h3 className="font-semibold text-gray-900 text-sm">Refunds</h3>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">📊</span>
            <h3 className="font-semibold text-gray-900 text-sm">Analytics</h3>
          </Link>
        </div>

        {/* KYC Queue */}
        <Card title={`KYC Approval Queue (${kycQueue.length}) pending`} className="mb-8">
          {kycQueue.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">✅ All KYC requests processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      User Email
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Full Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Submitted
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kycQueue.map((kyc) => (
                    <tr key={kyc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{kyc.userId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{kyc.data?.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(kyc.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/kyc/${kyc.userId}`}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Open Disputes */}
        <Card title={`Open Disputes (${disputes.length})`}>
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">✅ No open disputes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">Order {dispute.orderId?.slice(0, 8)}</h4>
                      <p className="text-sm text-gray-600 mt-1">{dispute.reason}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Reported by: {dispute.reportedBy}
                      </p>
                    </div>
                    <Link
                      href={`/admin/disputes/${dispute.id}`}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Resolve
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
