"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { date: "Jan 1", revenue: 2400 },
  { date: "Jan 5", revenue: 1398 },
  { date: "Jan 10", revenue: 9800 },
  { date: "Jan 15", revenue: 3908 },
  { date: "Jan 20", revenue: 4800 },
  { date: "Jan 25", revenue: 3800 },
  { date: "Jan 30", revenue: 4300 },
]

export function RevenueChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
            formatter={(value) => [`${value} USDC`, "Revenue"]}
          />
          <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
