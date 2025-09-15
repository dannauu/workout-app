import workoutTemplates from '@/data/workoutTemplates.json';

export interface WorkoutTemplate {
  title: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    defaultSets: {
      setNumber: number;
      reps: number;
      completed: boolean;
    }[];
  }[];
}

export const getWorkoutTemplate = (dayOfWeek: string): WorkoutTemplate | null => {
  return workoutTemplates[dayOfWeek as keyof typeof workoutTemplates] || null;
};

export const getAllWorkoutTemplates = (): typeof workoutTemplates => {
  return workoutTemplates;
};

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

export const getCurrentDayWorkout = (): WorkoutTemplate | null => {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  return getWorkoutTemplate(dayName);
};

export const getDayName = (): string => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
};
