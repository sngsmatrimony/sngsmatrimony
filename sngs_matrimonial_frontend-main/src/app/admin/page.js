'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, User } from 'lucide-react';

function StatsCard({ icon: Icon, label, value, subtitle, color = 'text-primary' }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold font-viga mt-2">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg bg-gray-100 ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const response = await adminApi.getDashboardAnalytics();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading analytics. Please try again.</p>
      </div>
    );
  }

  if (!analyticsData) {
    return <div>No analytics data available</div>;
  }

  const { counts, newUsersToday, newUsersThisWeek, newUsersThisMonth, averageAge, genderBreakdown, maritalStatusBreakdown, topCities, topStates, growthChart } = analyticsData;

  const genderChartData = genderBreakdown.map((item) => ({
    name: item._id || 'Unknown',
    value: item.count,
  }));

  // Extract male and female counts from genderBreakdown
  const maleCount = genderBreakdown.find(g => g._id === 'male')?.count || 0;
  const femaleCount = genderBreakdown.find(g => g._id === 'female')?.count || 0;

  const maritalStatusData = maritalStatusBreakdown.map((item) => ({
    name: item._id || 'Unknown',
    value: item.count,
  }));

  const citiesData = topCities.map((item) => ({
    name: item._id || 'Unknown',
    count: item.count,
  }));

  const statesData = topStates.map((item) => ({
    name: item._id || 'Unknown',
    count: item.count,
  }));

  const COLORS = ['#FFE100', '#FF9B00', '#7CEA9C', '#55D6BE', '#546A76'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Users"
          value={counts?.total || 0}
          color="text-primary"
        />
        <StatsCard
          icon={User}
          label="Male Users"
          value={maleCount}
          subtitle={`${((maleCount / (counts?.total || 1)) * 100).toFixed(1)}%`}
          color="text-secondary"
        />
        <StatsCard
          icon={User}
          label="Female Users"
          value={femaleCount}
          subtitle={`${((femaleCount / (counts?.total || 1)) * 100).toFixed(1)}%`}
          color="text-accent"
        />
        <StatsCard
          icon={Users}
          label="Average Age"
          value={Math.round(averageAge || 0)}
          subtitle="years"
          color="text-secondary"
        />
      </div>

      {/* New Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Users Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-viga text-primary">{newUsersToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-viga text-accent">{newUsersThisWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-viga text-success">{newUsersThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      {growthChart && growthChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#000000FF"
                  dot={{ fill: '#FFE100', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
