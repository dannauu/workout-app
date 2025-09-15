'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
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
  Link,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentWeight: '',
    targetWeight: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.userName,
          email: formData.email,
          password: formData.password,
          currentWeight: parseFloat(formData.currentWeight) || undefined,
          targetWeight: parseFloat(formData.targetWeight) || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto sign in after successful registration
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/');
        } else {
          router.push('/login');
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
          <FitnessCenterIcon 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main',
              mr: 1
            }} 
          />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Workout App
          </Typography>
        </Box>
        
        <Typography variant="h5" component="h2" mb={3}>
          Create Account
        </Typography>

        {_error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {_error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="username"
            autoFocus
          />
          
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
          />
          
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
          />
          
          <TextField
            fullWidth
            label="Current Weight (lbs)"
            name="currentWeight"
            type="number"
            value={formData.currentWeight}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Optional - can be set later"
          />
          
          <TextField
            fullWidth
            label="Target Weight (lbs)"
            name="targetWeight"
            type="number"
            value={formData.targetWeight}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0, step: 0.1 }}
            helperText="Optional - can be set later"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Account'
            )}
          </Button>
        </Box>

        <Box mt={2}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link href="/login" underline="hover">
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
