const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchInvoiceTrends() {
  const res = await fetch(`${API_BASE}/invoice-trends`);
  if (!res.ok) throw new Error('Failed to fetch invoice trends');
  return res.json();
}

export async function fetchTopVendors() {
  const res = await fetch(`${API_BASE}/vendors/top10`);
  if (!res.ok) throw new Error('Failed to fetch top vendors');
  return res.json();
}

export async function fetchCategorySpend() {
  const res = await fetch(`${API_BASE}/category-spend`);
  if (!res.ok) throw new Error('Failed to fetch category spend');
  return res.json();
}

export async function fetchCashOutflow(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const res = await fetch(`${API_BASE}/cash-outflow?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cash outflow');
  return res.json();
}

export async function fetchInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.vendorId) searchParams.append('vendorId', params.vendorId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);

  const res = await fetch(`${API_BASE}/invoices?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function chatWithData(query: string) {
  const res = await fetch(`${API_BASE}/chat-with-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to chat with data');
  return res.json();
}

