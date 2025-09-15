'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import {
  QueryStats,
  Person,
  Leaderboard,
  Home,
} from '@mui/icons-material';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const router = useRouter();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        textAlign: 'center',
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff9800 100%)',
        color: 'white',
        height: '170px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      {/* Left side buttons */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <IconButton
          onClick={() => router.push('/stats')}
          sx={{ color: 'white', borderColor: 'white' }}
          size="small"
        >
          <QueryStats fontSize="large" />
        </IconButton>
        <IconButton
          onClick={() => router.push('/leaderboard')}
          sx={{ color: 'white', borderColor: 'white' }}
          size="small"
        >
          <Leaderboard fontSize="large" />
        </IconButton>

        <IconButton
          onClick={() => router.push('/')}
          sx={{ color: 'white', borderColor: 'white' }}
          size="small"
        >
          <Home fontSize="large" />
        </IconButton>

        <IconButton
          onClick={() => router.push('/profile')}
          sx={{ color: 'white', borderColor: 'white' }}
          size="small"
        >
          <Person fontSize="large" />
        </IconButton>
      </Box>

      {/* Center content */}
      <Typography variant="h4" component="h1" fontWeight="bold">
        {title}
      </Typography>
      {
        subtitle && (
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {subtitle}
          </Typography>
        )
      }
    </Paper >
  );
}
