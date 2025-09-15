'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Checkbox,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { getDayName } from '@/utils/workoutUtils';
import AppHeader from '@/components/AppHeader';

// Custom hook to prevent hydration mismatch
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

// Custom hook to get day name safely for SSR
const useDayName = () => {
  const [dayName, setDayName] = useState('Workout');
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      setDayName(getDayName());
    }
  }, [isClient]);

  return dayName;
};

// Custom CircularProgress with label component
const CircularProgressWithLabel = ({ value, size = 120, thickness = 4 }: { value: number; size?: number; thickness?: number }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {/* Background circle - faded orange */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={thickness}
        sx={{
          color: 'rgba(255, 107, 53, 0.2)', // Faded orange
          position: 'absolute',
        }}
      />
      {/* Progress circle - solid orange */}
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={thickness}
        sx={{
          color: value === 100 ? 'success.main' : 'primary.main',
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h6"
          component="div"
          color="text.secondary"
          sx={{ fontWeight: 'bold' }}
        >
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight?: number;
  completed: boolean;
}

interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutDay {
  date: string;
  dayOfWeek: string;
  title: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  bodyWeight?: number;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dayName = useDayName();
  const [editingCell, setEditingCell] = useState<{
    exerciseName: string;
    setNumber: number;
    field: 'weight' | 'reps';
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [applyToAll, setApplyToAll] = useState<boolean>(false);
  const [weightModal, setWeightModal] = useState<{
    open: boolean;
    exerciseName: string;
    setNumber: number;
    currentWeight: number;
  }>({
    open: false,
    exerciseName: '',
    setNumber: 0,
    currentWeight: 0
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [bodyWeight, setBodyWeight] = useState<number | ''>('');

  // Redirect to sign up if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/register');
    }
  }, [status, router]);

  // Handle scroll to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Load workout data when authenticated
  useEffect(() => {
    if (session?.user?.id) {
      loadWorkoutData();
    }
  }, [session]);

  const loadWorkoutData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workouts', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkout(data.workout);
        setBodyWeight(data.workout.bodyWeight || '');
      } else if (response.status === 404) {
        // User not found, redirect to sign up
        router.push('/register');
      } else {
        const errorData = await response.json();
        showSnackbar(`Failed to load workout data: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      showSnackbar('Failed to load workout data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCellClick = (exerciseName: string, setNumber: number, field: 'weight' | 'reps', currentValue: string) => {
    if (field === 'weight') {
      // Open weight modal for weight fields
      setWeightModal({
        open: true,
        exerciseName,
        setNumber,
        currentWeight: parseFloat(currentValue) || 20
      });
    } else {
      // Use inline editing for reps
      setEditingCell({ exerciseName, setNumber, field });
      setEditingValue(currentValue);
      setApplyToAll(false);
    }
  };

  const handleCellSave = async () => {
    if (!editingCell || !workout) return;

    const { exerciseName, setNumber, field } = editingCell;
    const value = parseFloat(editingValue);

    if (isNaN(value) || value < 0) {
      showSnackbar('Please enter a valid number', 'error');
      return;
    }

    try {
      const response = await fetch('/api/workouts', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseName,
          setNumber,
          [field]: value
        }),
      });

      if (response.ok) {
        // Update local state
        setWorkout(prev => {
          if (!prev) return null;

          const newWorkout = { ...prev };
          const exerciseIndex = newWorkout.exercises.findIndex(ex => ex.name === exerciseName);

          if (exerciseIndex !== -1) {
            const setIndex = newWorkout.exercises[exerciseIndex].sets.findIndex(set => set.setNumber === setNumber);

            if (setIndex !== -1) {
              if (field === 'weight' && applyToAll && setNumber === 1) {
                // Apply weight to all sets
                newWorkout.exercises[exerciseIndex].sets.forEach(set => {
                  set.weight = value;
                });
                showSnackbar(`Weight updated: ${value} lbs for all sets of ${exerciseName}`, 'success');
              } else {
                // Update individual set
                newWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;
                showSnackbar(`${field === 'weight' ? 'Weight' : 'Reps'} updated: ${value}${field === 'weight' ? ' lbs' : ''} for ${exerciseName} Set ${setNumber}`, 'success');
              }
            }
          }

          return newWorkout;
        });
      } else {
        showSnackbar('Failed to save changes', 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showSnackbar('Failed to save changes', 'error');
    } finally {
      setEditingCell(null);
      setEditingValue('');
      setApplyToAll(false);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
    setApplyToAll(false);
  };

  const handleSetCompletion = async (exerciseName: string, setNumber: number, completed: boolean) => {
    try {
      const response = await fetch('/api/workouts', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseName,
          setNumber,
          completed
        }),
      });

      if (response.ok) {
        // Update local state
        setWorkout(prev => {
          if (!prev) return null;

          const newWorkout = { ...prev };
          const exerciseIndex = newWorkout.exercises.findIndex(ex => ex.name === exerciseName);

          if (exerciseIndex !== -1) {
            const setIndex = newWorkout.exercises[exerciseIndex].sets.findIndex(set => set.setNumber === setNumber);

            if (setIndex !== -1) {
              newWorkout.exercises[exerciseIndex].sets[setIndex].completed = completed;

              // Update total sets completed
              const totalCompleted = newWorkout.exercises.reduce(
                (total, ex) => total + ex.sets.filter(s => s.completed).length, 0
              );
              newWorkout.totalSetsCompleted = totalCompleted;
            }
          }

          return newWorkout;
        });

        showSnackbar(`Set ${setNumber} ${completed ? 'completed' : 'unchecked'}`, 'success');
      } else {
        showSnackbar('Failed to update set completion', 'error');
      }
    } catch (error) {
      console.error('Error updating set completion:', error);
      showSnackbar('Failed to update set completion', 'error');
    }
  };

  const handleWeightModalClose = () => {
    setWeightModal({
      open: false,
      exerciseName: '',
      setNumber: 0,
      currentWeight: 0
    });
  };

  const handleWeightSave = async (newWeight: number) => {
    if (!workout) return;

    const { exerciseName, setNumber } = weightModal;

    try {
      const response = await fetch('/api/workouts', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseName,
          setNumber,
          weight: newWeight
        }),
      });

      if (response.ok) {
        // Update local state
        setWorkout(prev => {
          if (!prev) return null;

          const newWorkout = { ...prev };
          const exerciseIndex = newWorkout.exercises.findIndex(ex => ex.name === exerciseName);

          if (exerciseIndex !== -1) {
            const setIndex = newWorkout.exercises[exerciseIndex].sets.findIndex(set => set.setNumber === setNumber);

            if (setIndex !== -1) {
              newWorkout.exercises[exerciseIndex].sets[setIndex].weight = newWeight;
            }
          }

          return newWorkout;
        });

        showSnackbar(`Weight updated: ${newWeight} lbs for ${exerciseName} Set ${setNumber}`, 'success');
        handleWeightModalClose();
      } else {
        showSnackbar('Failed to save weight', 'error');
      }
    } catch (error) {
      console.error('Error saving weight:', error);
      showSnackbar('Failed to save weight', 'error');
    }
  };

  const handleBodyWeightSave = async () => {
    if (!workout || bodyWeight === '') return;

    try {
      const response = await fetch('/api/workouts', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bodyWeight: parseFloat(bodyWeight.toString())
        }),
      });

      if (response.ok) {
        // Update local state
        setWorkout(prev => {
          if (!prev) return null;
          return { ...prev, bodyWeight: parseFloat(bodyWeight.toString()) };
        });

        showSnackbar(`Body weight updated: ${bodyWeight} lbs`, 'success');
      } else {
        showSnackbar('Failed to save body weight', 'error');
      }
    } catch (error) {
      console.error('Error saving body weight:', error);
      showSnackbar('Failed to save body weight', 'error');
    }
  };


  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <FitnessCenterIcon
            sx={{
              fontSize: 102,
              color: 'primary.main',
              animation: 'spin 2s linear infinite',
              '@keyframes spin': {
                '0%': {
                  transform: 'rotate(0deg)',
                },
                '100%': {
                  transform: 'rotate(360deg)',
                },
              },
            }}
          />
        </Box>
      </Container>
    );
  }

  if (!session) {
    return null;
  }


  return (
    <Container maxWidth="md">
      {/* Header */}
      <AppHeader 
        title={dayName}
        subtitle={isLoading ? 'Loading...' : (workout?.title || workout?.dayOfWeek + ' Workout' || 'No workout available')}
      />

      {/* Workout Content */}
      {isLoading ? (
        <Box>
          {/* Skeleton loader for workout progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Workout Progress
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  {/* Background circle - faded orange */}
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={140}
                    thickness={5}
                    sx={{
                      color: 'rgba(255, 107, 53, 0.2)', // Faded orange
                      position: 'absolute',
                    }}
                  />
                  {/* Loading spinner */}
                  <CircularProgress size={140} thickness={5} sx={{ opacity: 0.5 }} />
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.5 }}>
                  Loading progress...
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Skeleton loader for exercises */}
          {[1, 2, 3].map((index) => (
            <Card key={index} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ opacity: 0.5 }}>
                  Loading exercise...
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Set</TableCell>
                        <TableCell>Reps</TableCell>
                        <TableCell>Weight</TableCell>
                        <TableCell>Done</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[1, 2, 3, 4].map((setIndex) => (
                        <TableRow key={setIndex}>
                          <TableCell>{setIndex}</TableCell>
                          <TableCell sx={{ opacity: 0.5 }}>...</TableCell>
                          <TableCell sx={{ opacity: 0.5 }}>...</TableCell>
                          <TableCell>
                            <Checkbox disabled checked={false} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : workout ? (
        <Box>
          {/* Workout Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Workout Progress
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgressWithLabel
                  value={(workout.totalSetsCompleted / workout.totalSetsPlanned) * 100}
                  size={140}
                  thickness={5}
                />
                <Typography variant="body1" color="text.secondary">
                  {workout.totalSetsCompleted} / {workout.totalSetsPlanned} sets completed
                </Typography>
                {workout.totalSetsCompleted === workout.totalSetsPlanned && (
                  <Chip
                    label="Workout Complete! 🎉"
                    color="success"
                    size="medium"
                    sx={{ fontWeight: 'bold' }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Body Weight Tracking */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Today&apos;s Body Weight
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Body Weight (lbs)"
                  type="number"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value ? parseFloat(e.target.value) : '')}
                  size="small"
                  sx={{ flexGrow: 1 }}
                  inputProps={{ min: 0, step: 0.1 }}
                  helperText="Track your weight for today's workout"
                />
                <Button
                  onClick={handleBodyWeightSave}
                  variant="contained"
                  disabled={bodyWeight === ''}
                  sx={{ minWidth: 100, width: '100%' }}
                >
                  Save
                </Button>
              </Box>
              {workout.bodyWeight && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Current: {workout.bodyWeight} lbs
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Exercises */}
          {workout.exercises.map((exercise, exerciseIndex) => (
            <Card key={exerciseIndex} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {exercise.name}
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Set</TableCell>
                        <TableCell>Reps</TableCell>
                        <TableCell>Weight</TableCell>
                        <TableCell>Done</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exercise.sets.map((set) => (
                        <TableRow key={set.setNumber}>
                          <TableCell>{set.setNumber}</TableCell>
                          <TableCell
                            onClick={() => handleCellClick(exercise.name, set.setNumber, 'reps', set.reps.toString())}
                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                          >
                            {editingCell?.exerciseName === exercise.name &&
                              editingCell?.setNumber === set.setNumber &&
                              editingCell?.field === 'reps' ? (
                              <TextField
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') handleCellCancel();
                                }}
                                autoFocus
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: 1 }}
                                sx={{ width: 60 }}
                              />
                            ) : (
                              set.reps
                            )}
                          </TableCell>
                          <TableCell
                            onClick={() => handleCellClick(exercise.name, set.setNumber, 'weight', set.weight?.toString() || '0')}
                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                          >
                            {set.weight ? `${set.weight} lbs` : 'Tap to add'}
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={set.completed || false}
                              onChange={(e) => handleSetCompletion(exercise.name, set.setNumber, e.target.checked)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No workout found for today
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Weight Modal */}
      <Dialog
        open={weightModal.open}
        onClose={handleWeightModalClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Set Weight - {weightModal.exerciseName} Set {weightModal.setNumber}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="h6" align="center" gutterBottom>
              {weightModal.currentWeight} lbs
            </Typography>
            <Slider
              value={weightModal.currentWeight}
              onChange={(_, value) => setWeightModal(prev => ({ ...prev, currentWeight: value as number }))}
              step={5}
              marks
              min={5}
              max={300}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} lbs`}
              sx={{ mt: 3 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption">5 lbs</Typography>
              <Typography variant="caption">100 lbs</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleWeightModalClose}>
            Cancel
          </Button>
          <Button
            onClick={() => handleWeightSave(weightModal.currentWeight)}
            variant="contained"
          >
            Save Weight
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', textAlign: 'center' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Back to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            minWidth: 'auto',
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            color: 'white',
            boxShadow: 3,
            zIndex: 1000,
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease-in-out',
          }}
          aria-label="Back to top"
        >
          <KeyboardArrowUp sx={{ fontSize: 28 }} />
        </Button>
      )}
    </Container>
  );
}