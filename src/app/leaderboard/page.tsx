'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  FitnessCenter,
  Schedule,
  LocalFireDepartment,
} from '@mui/icons-material';
import AppHeader from '@/components/AppHeader';

interface LeaderboardUser {
  userName: string;
  currentWeight: number;
  targetWeight: number;
  weightDifference: number;
  isLosingWeight: boolean;
  progressToGoal: number;
  totalWorkouts: number;
  totalSetsCompleted: number;
  workoutCompletionRate: number;
  daysSinceJoining: number;
  averageWorkoutsPerWeek: number;
  lastWorkoutDate: string | null;
  lastWorkoutTitle: string | null;
  lastWorkoutSetsCompleted: number | null;
  daysSinceLastWorkout: number | null;
  weightChangeFromLastWorkout: number | null;
  currentStreak: number;
  startingWeight: number;
  actualWeightChange: number;
  combinedScore: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState('');

  // Redirect to sign up if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/register');
    }
  }, [status, router]);

  // Load leaderboard data
  useEffect(() => {
    if (session?.user?.id) {
      loadLeaderboardData();
    }
  }, [session]);

  const loadLeaderboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leaderboard', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      } else if (response.status === 404) {
        // User not found, redirect to sign up
        router.push('/register');
      } else {
        setError('Failed to load leaderboard data');
      }
    } catch (error) {
      setError('An error occurred while loading leaderboard');
    } finally {
      setIsLoading(false);
    }
  };


  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <EmojiEvents sx={{ color: '#FFD700', fontSize: 24 }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#C0C0C0', fontSize: 24 }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#CD7F32', fontSize: 24 }} />;
      default:
        return <Typography variant="h6" fontWeight="bold">#{rank}</Typography>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return 'primary.main';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <Container maxWidth="lg">
        <AppHeader title="Leaderboard"  />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (_error) {
    return (
      <Container maxWidth="lg">
        <AppHeader title="Leaderboard"  />
        <Alert severity="error" sx={{ mb: 3 }}>
          {_error}
        </Alert>
      </Container>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Container maxWidth="lg">
        <AppHeader title="Leaderboard"  />
        <Alert severity="info" sx={{ mb: 3 }}>
          No users with weight goals found. Set your weight goals in your profile to join the leaderboard!
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <AppHeader title="Leaderboard"  />

      {/* Mobile-Friendly Rankings */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: 'primary.main' }} />
            Fitness Rankings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete overview of all users&apos; progress and performance
          </Typography>
          
          {/* Mobile Card Layout */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {leaderboard.map((user) => (
              <Card 
                key={user.userName}
                sx={{ 
                  border: user.userName === session?.user?.name ? '2px solid #ff6b35' : '1px solid transparent',
                  bgcolor: user.userName === session?.user?.name ? 'rgba(255, 107, 53, 0.05)' : 'background.paper',
                  '&:hover': { boxShadow: 3 }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Header Row - Rank, User, Score */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRankIcon(user.rank)}
                      <Typography variant="h6" fontWeight="bold">
                        {user.userName}
                      </Typography>
                      {user.userName === session?.user?.name && (
                        <Chip label="You" size="small" color="primary" />
                      )}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color={getRankColor(user.rank)}>
                      {user.combinedScore.toFixed(1)}
                    </Typography>
                  </Box>

                  {/* Weight and Progress Row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="bold">
                        Current: {user.currentWeight} lbs
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Goal: {user.targetWeight} lbs
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Started: {user.startingWeight} lbs
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={user.actualWeightChange < 0 ? 'success.main' : user.actualWeightChange > 0 ? 'error.main' : 'text.secondary'}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                      >
                        {user.actualWeightChange > 0 ? '+' : ''}{user.actualWeightChange.toFixed(1)} lbs
                        {user.actualWeightChange > 0 ? <TrendingUp fontSize="small" /> : user.actualWeightChange < 0 ? <TrendingDown fontSize="small" /> : null}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 100 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {user.progressToGoal.toFixed(1)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={user.progressToGoal} 
                        sx={{ width: 80, height: 6, borderRadius: 3, mt: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {user.isLosingWeight ? 'Losing' : 'Gaining'} {user.weightDifference.toFixed(1)} lbs to goal
                      </Typography>
                    </Box>
                  </Box>

                  {/* Stats Row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalFireDepartment sx={{ color: user.currentStreak > 0 ? 'error.main' : 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight="bold">
                        {user.currentStreak} day streak
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FitnessCenter sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.totalWorkouts} workouts
                      </Typography>
                    </Box>
                  </Box>

                  {/* Last Workout Row */}
                  {user.lastWorkoutDate ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Last: {user.lastWorkoutTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.daysSinceLastWorkout === 0 ? 'Today' : 
                           user.daysSinceLastWorkout === 1 ? 'Yesterday' : 
                           `${user.daysSinceLastWorkout} days ago`}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          {user.averageWorkoutsPerWeek.toFixed(1)}/week
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.workoutCompletionRate.toFixed(1)}% completion
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      No workouts yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Leaderboard Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {leaderboard.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Users
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {leaderboard.reduce((sum, user) => sum + user.totalWorkouts, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Workouts
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {Math.round(leaderboard.reduce((sum, user) => sum + user.workoutCompletionRate, 0) / leaderboard.length)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Completion Rate
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Leaderboard List */}
      <Paper elevation={2}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            🏆 Fitness Champions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ranked by weight progress and workout consistency
          </Typography>

          {leaderboard.map((user) => (
            <Card 
              key={user.userName} 
              sx={{ 
                mb: 2, 
                border: user.userName === session?.user?.name ? '2px solid #ff6b35' : '1px solid transparent',
                bgcolor: user.userName === session?.user?.name ? 'rgba(255, 107, 53, 0.05)' : 'background.paper'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Rank */}
                  <Box sx={{ minWidth: 60, textAlign: 'center' }}>
                    {getRankIcon(user.rank)}
                  </Box>

                  {/* User Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {user.userName}
                      </Typography>
                      {user.userName === session?.user?.name && (
                        <Chip label="You" size="small" color="primary" />
                      )}
                    </Box>

                    {/* Weight Progress */}
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {user.isLosingWeight ? (
                          <TrendingDown sx={{ color: 'success.main', fontSize: 16 }} />
                        ) : (
                          <TrendingUp sx={{ color: 'primary.main', fontSize: 16 }} />
                        )}
                        <Typography variant="body2">
                          {user.isLosingWeight ? 'Losing' : 'Gaining'} {user.weightDifference.toFixed(1)} lbs
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({user.progressToGoal.toFixed(1)}% to goal)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={user.progressToGoal} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>

                    {/* Workout Stats */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FitnessCenter sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {user.totalWorkouts} workouts
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {user.averageWorkoutsPerWeek.toFixed(1)}/week
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.workoutCompletionRate.toFixed(1)}% completion
                      </Typography>
                    </Box>
                  </Box>

                  {/* Combined Score */}
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="h6" fontWeight="bold" color={getRankColor(user.rank)}>
                      {user.combinedScore.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Legend */}
      <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          How the Leaderboard Works
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Users are ranked by a combined score that considers both weight progress and workout consistency:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Weight Progress (60% of score)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Percentage of progress toward your weight goal
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Workout Consistency (40% of score)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completion rate of planned workout sets
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

