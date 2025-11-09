'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OutflowData {
  date: string;
  amount: number;
}

interface Props {
  data: OutflowData[];
}

export function CashOutflowChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: item.amount || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" fill="#8884d8" name="Outflow (€)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

