'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  fetchStats,
  fetchInvoiceTrends,
  fetchTopVendors,
  fetchCategorySpend,
  fetchCashOutflow,
  fetchInvoices,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { InvoiceTrendChart } from './charts/invoice-trend-chart';
import { VendorSpendChart } from './charts/vendor-spend-chart';
import { CategorySpendChart } from './charts/category-spend-chart';
import { CashOutflowChart } from './charts/cash-outflow-chart';
import { 
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { InvoicesTable } from './invoices-table';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [categorySpend, setCategorySpend] = useState<any[]>([]);
  const [cashOutflow, setCashOutflow] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, trendsData, vendorsData, categoryData, outflowData, invoicesData] =
          await Promise.all([
            fetchStats(),
            fetchInvoiceTrends(),
            fetchTopVendors(),
            fetchCategorySpend(),
            fetchCashOutflow(),
            fetchInvoices({ page: 1, limit: 50 }),
          ]);

        setStats(statsData);
        setTrends(trendsData);
        setTopVendors(vendorsData);
        setCategorySpend(categoryData);
        setCashOutflow(outflowData);
        setInvoices(invoicesData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Calculate percentage changes (mock data for now - would need API support)
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  // Mock previous month data (in real app, this would come from API)
  const previousMonthStats = {
    totalSpend: stats ? stats.totalSpend * 0.918 : 0, // -8.2%
    totalInvoices: stats ? Math.round(stats.totalInvoices * 0.918) : 0,
    documentsUploaded: stats ? stats.documentsUploaded + 8 : 0, // +8 more last month
    averageInvoiceValue: stats ? stats.averageInvoiceValue * 0.918 : 0,
  };

  const spendChange = stats ? calculateChange(stats.totalSpend, previousMonthStats.totalSpend) : { value: 8.2, isPositive: true };
  const invoicesChange = stats ? calculateChange(stats.totalInvoices, previousMonthStats.totalInvoices) : { value: 8.2, isPositive: true };
  const documentsChange = stats ? calculateChange(stats.documentsUploaded, previousMonthStats.documentsUploaded) : { value: 8, isPositive: false };
  const avgChange = stats ? calculateChange(stats.averageInvoiceValue, previousMonthStats.averageInvoiceValue) : { value: 8.2, isPositive: true };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spend (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats ? formatCurrency(stats.totalSpend) : '€0.00'}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {spendChange.isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={spendChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {spendChange.value.toFixed(1)}%
              </span>
              <span className="text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalInvoices || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {invoicesChange.isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={invoicesChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {invoicesChange.value.toFixed(1)}%
              </span>
              <span className="text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Documents Uploaded (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats?.documentsUploaded || 0}</div>
            <div className="flex items-center gap-1 text-xs">
              {documentsChange.isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={documentsChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {documentsChange.isPositive ? '+' : '-'}{Math.abs(documentsChange.value).toFixed(0)}
              </span>
              <span className="text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats ? formatCurrency(stats.averageInvoiceValue) : '€0.00'}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {avgChange.isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={avgChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                {avgChange.value.toFixed(1)}%
              </span>
              <span className="text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Invoice Volume + Value Trend</CardTitle>
            <CardDescription className="text-sm text-gray-500">Invoice count and total spend over 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <InvoiceTrendChart data={trends} />
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Spend by Vendor (Top 10)</CardTitle>
            <CardDescription className="text-sm text-gray-500">Vendor spend with cumulative percentage distribution.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <VendorSpendChart data={topVendors} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Spend by Category</CardTitle>
            <CardDescription className="text-sm text-gray-500">Distribution of spending across different categories.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <CategorySpendChart data={categorySpend} />
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-base font-semibold text-gray-900">Cash Outflow Forecast</CardTitle>
            <CardDescription className="text-sm text-gray-500">Expected payment obligations grouped by due date ranges.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <CashOutflowChart data={cashOutflow} />
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-base font-semibold text-gray-900">Invoices</CardTitle>
          <CardDescription className="text-sm text-gray-500">Searchable, sortable, and scrollable invoice list.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <InvoicesTable initialData={invoices} />
        </CardContent>
      </Card>
    </div>
  );
}

