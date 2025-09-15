'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Logout } from '@mui/icons-material';
import AppHeader from '@/components/AppHeader';

interface UserProfile {
  userName: string;
  email: string;
  currentWeight?: number;
  targetWeight?: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to sign up if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/register');
    }
  }, [status, router]);

  // Load profile data
  useEffect(() => {
    if (session?.user?.id) {
      loadProfileData();
    }
  }, [session]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        // User not found, redirect to sign up
        router.push('/register');
      } else {
        setError('Failed to load profile data');
      }
    } catch (error) {
      setError('An error occurred while loading profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentWeight: profile.currentWeight ? parseFloat(profile.currentWeight.toString()) : undefined,
          targetWeight: profile.targetWeight ? parseFloat(profile.targetWeight.toString()) : undefined,
        }),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/register' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <Container maxWidth="md">
        <AppHeader title="Profile"  />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error && !profile) {
    return (
      <Container maxWidth="md">
        <AppHeader title="Profile"  />
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={() => router.push('/')} variant="contained">
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md">
        <AppHeader title="Profile"  />
        <Alert severity="info" sx={{ mb: 3 }}>
          No profile data available.
        </Alert>
        <Button onClick={() => router.push('/')} variant="contained">
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <AppHeader title="Profile" subtitle="Manage your personal details"  />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Personal Information
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Username"
            value={profile.userName}
            disabled
            margin="normal"
            helperText="Username cannot be changed"
          />
          
          <TextField
            fullWidth
            label="Email"
            value={profile.email}
            disabled
            margin="normal"
            helperText="Email cannot be changed"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Weight Goals
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Current Weight (lbs)"
            type="number"
            value={profile.currentWeight || ''}
            onChange={(e) => setProfile({
              ...profile,
              currentWeight: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            margin="normal"
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Your current weight for tracking progress"
          />
          
          <TextField
            fullWidth
            label="Target Weight (lbs)"
            type="number"
            value={profile.targetWeight || ''}
            onChange={(e) => setProfile({
              ...profile,
              targetWeight: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            margin="normal"
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Your goal weight for motivation"
          />
        </Box>

        {profile.currentWeight && profile.targetWeight && (
          <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress to Goal
              </Typography>
              <Typography variant="body1">
                {profile.currentWeight > profile.targetWeight ? (
                  <>
                    You need to lose <strong>{profile.currentWeight - profile.targetWeight} lbs</strong> to reach your goal.
                    <br />
                    Progress: <strong>{Math.max(0, Math.min(100, ((profile.currentWeight - profile.targetWeight) / (profile.currentWeight - profile.targetWeight)) * 100)).toFixed(1)}%</strong>
                  </>
                ) : (
                  <>
                    You need to gain <strong>{profile.targetWeight - profile.currentWeight} lbs</strong> to reach your goal.
                    <br />
                    Progress: <strong>{Math.max(0, Math.min(100, ((profile.currentWeight - profile.targetWeight) / (profile.currentWeight - profile.targetWeight)) * 100)).toFixed(1)}%</strong>
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSave}
          variant="contained"
          size="large"
          disabled={isSaving}
          fullWidth
          sx={{ mb: 2 }}
        >
          {isSaving ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Save Changes'
          )}
        </Button>

        <Divider sx={{ my: 3 }} />

        <Button
          onClick={handleLogout}
          variant="outlined"
          size="large"
          fullWidth
          startIcon={<Logout />}
          sx={{ 
            color: 'error.main',
            borderColor: 'error.main',
            '&:hover': {
              borderColor: 'error.dark',
              backgroundColor: 'error.light',
              color: 'error.dark'
            }
          }}
        >
          Logout
        </Button>
      </Paper>
    </Container>
  );
}
