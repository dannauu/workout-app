import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getWorkoutTemplate, formatDate } from '@/utils/workoutUtils';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
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

    const today = new Date();
    const todayFormatted = formatDate(today);
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get today's workout from user's workouts
    let todayWorkout = user.workouts.find((workout: any) => workout.date === todayFormatted);
    
    // If workout exists but is missing title, add it
    if (todayWorkout && !todayWorkout.title) {
      const template = getWorkoutTemplate(dayOfWeek);
      if (template) {
        todayWorkout.title = template.title;
        await user.save();
      }
    }
    
    // If no workout exists for today, create one from template
    if (!todayWorkout) {
      const template = getWorkoutTemplate(dayOfWeek);
      
      if (template) {
        const newWorkout = {
          date: todayFormatted,
          dayOfWeek,
          title: template.title,
          exercises: template.exercises.map((exercise: any) => ({
            name: exercise.name,
            sets: exercise.defaultSets.map((set: any) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: undefined,
              completed: false
            }))
          })),
          completed: false,
          totalSetsCompleted: 0,
          totalSetsPlanned: template.exercises.reduce((total: number, ex: any) => total + ex.defaultSets.length, 0)
        };
        
        user.workouts.push(newWorkout);
        await user.save();
        
        todayWorkout = newWorkout;
      } else {
        return NextResponse.json({ error: 'No workout template found for today' }, { status: 404 });
      }
    }

    return NextResponse.json({
      workout: todayWorkout,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const { exerciseName, setNumber, reps, weight, completed, bodyWeight } = await request.json();
    
    // Handle body weight update
    if (bodyWeight !== undefined) {
      const today = new Date();
      const todayFormatted = formatDate(today);
      
      // Find today's workout
      const workoutIndex = user.workouts.findIndex((workout: any) => workout.date === todayFormatted);
      
      if (workoutIndex === -1) {
        return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
      }

      // Update body weight in workout
      user.workouts[workoutIndex].bodyWeight = bodyWeight;
      
      // Update user's current weight and add to weight history
      user.currentWeight = bodyWeight;
      
      // Add to weight history if not already recorded for today
      const existingWeightEntry = user.weightHistory.find((entry: any) => entry.date === todayFormatted);
      if (!existingWeightEntry) {
        user.weightHistory.push({
          date: todayFormatted,
          weight: bodyWeight
        });
      } else {
        existingWeightEntry.weight = bodyWeight;
      }
      
      await user.save();
      return NextResponse.json({ success: true });
    }
    
    if (!exerciseName || !setNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const today = new Date();
    const todayFormatted = formatDate(today);
    
    // Find today's workout
    const workoutIndex = user.workouts.findIndex((workout: any) => workout.date === todayFormatted);
    
    if (workoutIndex === -1) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Find the exercise and set
    const exerciseIndex = user.workouts[workoutIndex].exercises.findIndex(
      (ex: any) => ex.name === exerciseName
    );
    
    if (exerciseIndex === -1) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const setIndex = user.workouts[workoutIndex].exercises[exerciseIndex].sets.findIndex(
      (set: any) => set.setNumber === setNumber
    );
    
    if (setIndex === -1) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    // Update the set
    const set = user.workouts[workoutIndex].exercises[exerciseIndex].sets[setIndex];
    
    if (reps !== undefined) set.reps = reps;
    if (weight !== undefined) set.weight = weight;
    if (completed !== undefined) set.completed = completed;

    // Update total sets completed
    const totalCompleted = user.workouts[workoutIndex].exercises.reduce(
      (total: number, ex: any) => total + ex.sets.filter((s: any) => s.completed).length, 0
    );
    user.workouts[workoutIndex].totalSetsCompleted = totalCompleted;

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}
