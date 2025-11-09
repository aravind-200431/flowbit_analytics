'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { fetchInvoices } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string | null;
  vendor: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
}

interface Props {
  initialData: any;
}

type SortField = 'invoiceNumber' | 'invoiceDate' | 'vendor' | 'amount' | 'status' | 'dueDate';
type SortDirection = 'asc' | 'desc' | null;

export function InvoicesTable({ initialData }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialData?.data || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(initialData?.pagination || { total: 0, totalPages: 1 });
  const [sortField, setSortField] = useState<SortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInvoices();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, page]);

  async function loadInvoices() {
    setLoading(true);
    try {
      const data = await fetchInvoices({
        page,
        limit: 50,
        search: search || undefined,
      });
      setInvoices(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField('invoiceDate');
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = useMemo(() => {
    if (!sortDirection) return invoices;

    return [...invoices].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'invoiceNumber':
          aValue = a.invoiceNumber || '';
          bValue = b.invoiceNumber || '';
          break;
        case 'invoiceDate':
          aValue = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
          bValue = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
          break;
        case 'vendor':
          aValue = a.vendor || '';
          bValue = b.vendor || '';
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  }, [invoices, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by invoice number, vendor..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Scrollable Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('invoiceNumber')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Invoice #
                    <SortIcon field="invoiceNumber" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('invoiceDate')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Date
                    <SortIcon field="invoiceDate" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('vendor')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Vendor
                    <SortIcon field="vendor" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Amount
                    <SortIcon field="amount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('dueDate')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                  >
                    Due Date
                    <SortIcon field="dueDate" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(invoice.invoiceDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{invoice.vendor}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(invoice.dueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          Showing {invoices.length} of {pagination.total} invoices
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

