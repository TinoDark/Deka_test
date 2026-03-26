'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const dashboardMap: Record<string, string> = {
        admin: '/admin/dashboard',
        supplier: '/suppliers/dashboard',
        reseller: '/resellers/dashboard',
        delivery: '/delivery/dashboard',
      };
      router.push(dashboardMap[user.role] || '/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">🚀 DEKA</h1>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Social-Commerce Made Simple
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Connect suppliers with resellers. Build income streams through social networks. 
          Manage everything from one powerful platform.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Start Selling Now
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perfect for Every Role
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Supplier Card */}
            <div className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <span className="text-4xl block mb-4">🏭</span>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">For Suppliers</h4>
              <ul className="space-y-3 text-gray-700">
                <li>✓ Liquidate inventory fast</li>
                <li>✓ Reach thousands of resellers</li>
                <li>✓ Manage stock digitally</li>
                <li>✓ Track all orders in real-time</li>
                <li>✓ Get paid automatically</li>
              </ul>
            </div>

            {/* Reseller Card */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                Most Popular
              </div>
              <span className="text-4xl block mb-4">🛍️</span>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">For Resellers</h4>
              <ul className="space-y-3 text-gray-700">
                <li>✓ Start with zero capital</li>
                <li>✓ Access premium products</li>
                <li>✓ Create your own store</li>
                <li>✓ Earn 15-30% commission</li>
                <li>✓ Withdraw earnings instantly</li>
              </ul>
            </div>

            {/* Delivery Card */}
            <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <span className="text-4xl block mb-4">🚚</span>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">For Delivery</h4>
              <ul className="space-y-3 text-gray-700">
                <li>✓ Flexible work schedule</li>
                <li>✓ Accept nearby deliveries</li>
                <li>✓ Track packages easily</li>
                <li>✓ Earn per delivery</li>
                <li>✓ Offline mode available</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <p className="text-blue-100">Active Suppliers</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5K+</div>
              <p className="text-blue-100">Resellers Earning</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <p className="text-blue-100">Orders Delivered</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2M+</div>
              <p className="text-blue-100">Total Processed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h3 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h3>
        <p className="text-gray-600 mb-8 text-lg">
          Join thousands of entrepreneurs building income streams on DEKA
        </p>
        <Link
          href="/signup"
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg inline-block"
        >
          Sign Up in 2 Minutes
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">DEKA</h4>
              <p className="text-sm">Social-Commerce as a Service Platform</p>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Product</h5>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Company</h5>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Legal</h5>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 DEKA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
