'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { fetchInvoices } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface VendorInvoiceData {
  vendor: string;
  invoiceCount: number;
  netValue: number;
}

export function InvoicesByVendorTable() {
  const [data, setData] = useState<VendorInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchInvoices({ page: 1, limit: 1000 });
        const invoices = response.data || [];

        // Group by vendor
        const vendorMap = new Map<string, { count: number; total: number }>();

        invoices.forEach((invoice: any) => {
          const vendor = invoice.vendor || 'Unknown';
          const existing = vendorMap.get(vendor) || { count: 0, total: 0 };
          vendorMap.set(vendor, {
            count: existing.count + 1,
            total: existing.total + (invoice.amount || 0),
          });
        });

        // Convert to array and sort by net value
        const vendorData: VendorInvoiceData[] = Array.from(vendorMap.entries())
          .map(([vendor, data]) => ({
            vendor,
            invoiceCount: data.count,
            netValue: data.total,
          }))
          .sort((a, b) => b.netValue - a.netValue)
          .slice(0, 10); // Top 10

        setData(vendorData);
      } catch (error) {
        console.error('Error loading invoices by vendor:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <CardTitle className="text-lg font-semibold">Invoices by Vendor</CardTitle>
          <CardDescription className="text-sm">Top vendors by invoice count and net value.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
        <CardTitle className="text-lg font-semibold">Invoices by Vendor</CardTitle>
        <CardDescription className="text-sm">Top vendors by invoice count and net value.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  # Invoices
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Net Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.vendor}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.invoiceCount}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(item.netValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

