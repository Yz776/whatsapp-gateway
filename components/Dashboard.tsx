import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';

const StatCard: React.FC<{ title: string; value: string; change: string; isPositive: boolean }> = ({ title, value, change, isPositive }) => (
  <div className="bg-card p-6 rounded-xl shadow-lg">
    <p className="text-sm font-medium text-text-secondary">{title}</p>
    <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
    <p className={`text-xs mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {change} vs last week
    </p>
  </div>
);

const Dashboard: React.FC = () => {
  const { dashboardStats } = useAppContext();

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Messages Sent" value={dashboardStats.messageSent.toLocaleString()} change={formatChange(dashboardStats.sentChange)} isPositive={dashboardStats.sentChange >= 0} />
        <StatCard title="Messages Received" value={dashboardStats.messageReceived.toLocaleString()} change={formatChange(dashboardStats.receivedChange)} isPositive={dashboardStats.receivedChange >= 0} />
        <StatCard title="Webhook Events" value={dashboardStats.webhookEvents.toLocaleString()} change={formatChange(dashboardStats.webhookChange)} isPositive={dashboardStats.webhookChange >= 0} />
        <StatCard title="API Calls" value={dashboardStats.apiCalls.toLocaleString()} change={formatChange(dashboardStats.apiCallsChange)} isPositive={dashboardStats.apiCallsChange >= 0} />
      </div>
      
      <div className="bg-card p-6 rounded-xl shadow-lg h-96">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Message Traffic (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={dashboardStats.weeklyTraffic} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
              }}
              cursor={{ fill: '#334155' }}
            />
            <Legend />
            <Bar dataKey="sent" fill="#25D366" name="Sent" />
            <Bar dataKey="received" fill="#128C7E" name="Received" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
