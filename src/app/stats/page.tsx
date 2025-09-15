'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  FitnessCenter,
  CalendarToday,
  CheckCircle,
} from '@mui/icons-material';
import AppHeader from '@/components/AppHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface WorkoutStats {
  totalWorkouts: number;
  totalSetsCompleted: number;
  averageSetsPerWorkout: number;
  completionRate: number;
  weeklyData: Array<{
    week: string;
    workouts: number;
    setsCompleted: number;
  }>;
  exerciseData: Array<{
    name: string;
    totalSets: number;
    completionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    workouts: number;
    setsCompleted: number;
  }>;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to sign up if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/register');
    }
  }, [status, router]);

  // Load stats data
  useEffect(() => {
    if (session?.user?.id) {
      loadStatsData();
    }
  }, [session]);

  const loadStatsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 404) {
        // User not found, redirect to sign up
        router.push('/register');
      } else {
        setError('Failed to load stats data');
      }
    } catch (error) {
      setError('An error occurred while loading stats');
    } finally {
      setIsLoading(false);
    }
  };


  if (status === 'loading' || isLoading) {
    return (
      <Container maxWidth="lg">
        <AppHeader title="Lifetime Stats"  />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <AppHeader title="Lifetime Stats"  />
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={() => router.push('/')} startIcon={<ArrowBack />}>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxWidth="lg">
        <AppHeader title="Lifetime Stats"  />
        <Alert severity="info" sx={{ mb: 3 }}>
          No workout data available yet. Start working out to see your stats!
        </Alert>
        <Button onClick={() => router.push('/')} startIcon={<ArrowBack />}>
          Back to Home
        </Button>
      </Container>
    );
  }

  const COLORS = ['#ff6b35', '#ff9800', '#ffb74d', '#ffc107', '#ffeb3b'];

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <AppHeader title="Lifetime Stats"  />

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <FitnessCenter sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {stats.totalWorkouts}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Workouts
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {stats.totalSetsCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sets Completed
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {stats.averageSetsPerWorkout.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Sets/Workout
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CalendarToday sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {stats.completionRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)'
          },
          gap: 3,
          mb: 3
        }}
      >
        {/* Weekly Progress Chart */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom textAlign="center"> 
              Weekly Progress
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="workouts" stroke="#ff6b35" strokeWidth={2} name="Workouts" />
                <Line type="monotone" dataKey="setsCompleted" stroke="#ff9800" strokeWidth={2} name="Sets Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Exercise Distribution */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom textAlign="center">
              Exercise Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.exerciseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalSets"
                >
                  {stats.exerciseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Monthly Trends - Full Width */}
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom textAlign="center">
              Monthly Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="workouts" fill="#ff6b35" name="Workouts" />
                <Bar dataKey="setsCompleted" fill="#ff9800" name="Sets Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
