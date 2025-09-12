import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartStatsProps {
  title: string;
  data: { name: string; value: number }[];
  colors?: string[];
}

const defaultColors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

const PieChartStats: React.FC<PieChartStatsProps> = ({ title, data, colors = defaultColors }) => {
  const validData = Array.isArray(data)
    ? data.filter(item => item && typeof item.name === 'string' && typeof item.value === 'number' && !isNaN(item.value))
    : [];

  if (!validData.length) {
    return <div className="h-[300px] w-full flex items-center justify-center text-gray-500">No data available</div>;
  }

  return (
    <div className="bg-white rounded-lg p-4 mb-6">
      <h3 className="text-md font-semibold mb-4 text-center">{title}</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={validData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              innerRadius={0}
              paddingAngle={0}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {validData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChartStats;
