import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User, { IWorkoutDay, IWorkoutSet } from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate statistics
    const totalWorkouts = user.workouts.length;
    const totalSetsCompleted = user.workouts.reduce((total: number, workout: IWorkoutDay) => {
      return total + (workout.totalSetsCompleted || 0);
    }, 0);

    const totalSetsPlanned = user.workouts.reduce((total: number, workout: IWorkoutDay) => {
      return total + (workout.totalSetsPlanned || 0);
    }, 0);

    const averageSetsPerWorkout = totalWorkouts > 0 ? totalSetsCompleted / totalWorkouts : 0;
    const completionRate = totalSetsPlanned > 0 ? (totalSetsCompleted / totalSetsPlanned) * 100 : 0;

    // Generate weekly data (last 8 weeks)
    const weeklyData = [];
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekWorkouts = user.workouts.filter((workout: IWorkoutDay) => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      const weekSetsCompleted = weekWorkouts.reduce((total: number, workout: IWorkoutDay) => {
        return total + (workout.totalSetsCompleted || 0);
      }, 0);

      weeklyData.push({
        week: `Week ${8 - i}`,
        workouts: weekWorkouts.length,
        setsCompleted: weekSetsCompleted,
      });
    }

    // Generate exercise data
    const exerciseMap = new Map();
    user.workouts.forEach((workout: IWorkoutDay) => {
      workout.exercises?.forEach((exercise: { name: string; sets: IWorkoutSet[] }) => {
        const exerciseName = exercise.name;
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, {
            name: exerciseName,
            totalSets: 0,
            completedSets: 0,
          });
        }
        
        const exerciseData = exerciseMap.get(exerciseName);
        exercise.sets?.forEach((set: IWorkoutSet) => {
          exerciseData.totalSets++;
          if (set.completed) {
            exerciseData.completedSets++;
          }
        });
      });
    });

    const exerciseData = Array.from(exerciseMap.values()).map(exercise => ({
      name: exercise.name,
      totalSets: exercise.totalSets,
      completionRate: exercise.totalSets > 0 ? (exercise.completedSets / exercise.totalSets) * 100 : 0,
    })).sort((a, b) => b.totalSets - a.totalSets).slice(0, 10); // Top 10 exercises

    // Generate monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthWorkouts = user.workouts.filter((workout: IWorkoutDay) => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= monthStart && workoutDate <= monthEnd;
      });

      const monthSetsCompleted = monthWorkouts.reduce((total: number, workout: IWorkoutDay) => {
        return total + (workout.totalSetsCompleted || 0);
      }, 0);

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      monthlyTrends.push({
        month: monthName,
        workouts: monthWorkouts.length,
        setsCompleted: monthSetsCompleted,
      });
    }

    const stats = {
      totalWorkouts,
      totalSetsCompleted,
      averageSetsPerWorkout,
      completionRate,
      weeklyData,
      exerciseData,
      monthlyTrends,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
