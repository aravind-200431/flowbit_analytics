'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  month: string;
  count: number;
  value: number;
}

interface Props {
  data: TrendData[];
}

export function InvoiceTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    month: item.month,
    count: item.count || 0,
    value: item.value || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="count"
          stroke="#8884d8"
          name="Invoice Count"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="value"
          stroke="#82ca9d"
          name="Total Value (€)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

