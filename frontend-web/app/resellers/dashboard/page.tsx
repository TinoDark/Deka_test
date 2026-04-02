'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Card, StatCard } from '@/components/Card';
import { WalletService, OrderService } from '@/lib/services';
import Link from 'next/link';

export default function ResellerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== 'reseller') {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletData, ordersData, earningsData] = await Promise.all([
        WalletService.getWallet(),
        OrderService.listOrders(undefined, 5),
        WalletService.getEarningsStats(),
      ]);

      setWallet(walletData);
      setRecentOrders(ordersData.data);
      setStats(earningsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.email}! 👋</h1>
          <p className="text-gray-600 mt-2">Manage your store and track your earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Current Balance"
            value={`${wallet?.balance?.toLocaleString() || 0} XAF`}
            icon="💰"
            color="green"
          />
          <StatCard
            label="Today Earnings"
            value={`${stats?.dailyEarnings?.toLocaleString() || 0} XAF`}
            icon="📈"
            color="blue"
          />
          <StatCard
            label="Weekly Earnings"
            value={`${stats?.weeklyEarnings?.toLocaleString() || 0} XAF`}
            icon="📊"
            color="yellow"
          />
          <StatCard
            label="Total Earnings"
            value={`${stats?.totalEarnings?.toLocaleString() || 0} XAF`}
            icon="🏆"
            color="blue"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/resellers/catalog"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">📦</span>
            <h3 className="font-semibold text-gray-900">Browse Catalog</h3>
            <p className="text-sm text-gray-600">Add products to your store</p>
          </Link>

          <Link
            href="/resellers/wallet"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">💳</span>
            <h3 className="font-semibold text-gray-900">Wallet & Payouts</h3>
            <p className="text-sm text-gray-600">Withdraw your earnings</p>
          </Link>

          <Link
            href="/resellers/store"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <span className="text-3xl block mb-2">🛍️</span>
            <h3 className="font-semibold text-gray-900">My Store</h3>
            <p className="text-sm text-gray-600">View your public store</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <Card title="Recent Orders">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Order ID</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {order.totalAmount.toLocaleString()} XAF
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/resellers/orders/${order.id}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/resellers/orders"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View all orders →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
