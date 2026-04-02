'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Card, StatCard } from '@/components/Card';
import { OrderService, CatalogService } from '@/lib/services';
import Link from 'next/link';

export default function SupplierDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== 'supplier') {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([
        OrderService.getSupplierOrders('processing', 10),
        CatalogService.getProducts({ limit: 5 }),
      ]);

      setPendingOrders(ordersData.data);
      setProducts(productsData.data);

      // Calculate stats
      setStats({
        activeProducts: productsData.total,
        pendingOrders: ordersData.total,
        totalRevenue: 0, // Would come from payments service
      });
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
          <div className="animate-spin text-4xl">...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your inventory and orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Active Products"
            value={stats?.activeProducts || 0}
            icon=""
            color="blue"
          />
          <StatCard label="Pending Orders" value={stats?.pendingOrders || 0} icon="" color="yellow" />
          <StatCard
            label="Total Revenue"
            value={`${(stats?.totalRevenue || 0).toLocaleString()} XAF`}
            icon=""
            color="green"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/suppliers/inventory"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <h3 className="font-semibold text-gray-900">Manage Inventory</h3>
            <p className="text-sm text-gray-600">Add/update products via Excel</p>
          </Link>

          <Link
            href="/suppliers/orders"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <h3 className="font-semibold text-gray-900">Orders to Prepare</h3>
            <p className="text-sm text-gray-600">Confirm preparation status</p>
          </Link>

          <Link
            href="/suppliers/analytics"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition text-center"
          >
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">View sales performance</p>
          </Link>
        </div>

        {/* Pending Orders */}
        <Card title="Orders Waiting for Preparation">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No pending orders at the moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Order ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Items</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {order.totalAmount.toLocaleString()} XAF
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/suppliers/orders/${order.id}`}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Prepare
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card title="Your Top Products" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                {product.image_cdn_url && (
                  <img
                    src={product.image_cdn_url}
                    alt={product.nom_produit}
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                )}
                <h4 className="font-semibold text-sm text-gray-900 truncate">
                  {product.nom_produit}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {product.prix_vente.toLocaleString()} XAF
                </p>
                <p className="text-xs text-green-600 font-medium mt-2">
                  Stock: {product.stock_quantity}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
