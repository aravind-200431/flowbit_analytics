'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VendorData {
  vendorId: string;
  vendorName: string;
  totalSpend: number;
}

interface Props {
  data: VendorData[];
}

export function VendorSpendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.vendorName.length > 20 ? item.vendorName.substring(0, 20) + '...' : item.vendorName,
    spend: item.totalSpend || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={120} />
        <Tooltip />
        <Legend />
        <Bar dataKey="spend" fill="#8884d8" name="Spend (€)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

