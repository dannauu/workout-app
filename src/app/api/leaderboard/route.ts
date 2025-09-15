import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all users with their weight goals and workout stats
    const users = await User.find({
      $and: [
        { currentWeight: { $exists: true, $ne: null } },
        { targetWeight: { $exists: true, $ne: null } }
      ]
    }).select('userName currentWeight targetWeight workouts createdAt weightHistory');

    // Calculate progress for each user
    const leaderboardData = users.map((user: any) => {
      const totalWorkouts = user.workouts.length;
      const totalSetsCompleted = user.workouts.reduce((total: number, workout: any) => {
        return total + (workout.totalSetsCompleted || 0);
      }, 0);

      const totalSetsPlanned = user.workouts.reduce((total: number, workout: any) => {
        return total + (workout.totalSetsPlanned || 0);
      }, 0);

      const workoutCompletionRate = totalSetsPlanned > 0 ? (totalSetsCompleted / totalSetsPlanned) * 100 : 0;

      // Get the user's weight history
      const weightHistory = user.weightHistory || [];
      
      // Current weight = most recent weight from history (or currentWeight if no history)
      const currentWeightFromHistory = weightHistory.length > 0 
        ? weightHistory[weightHistory.length - 1].weight
        : user.currentWeight;
      
      // Starting weight = the very first weight they ever entered (never changes)
      const startingWeight = weightHistory.length > 0 
        ? weightHistory[0].weight  // First weight in history
        : user.currentWeight; // Fallback if no history yet
      
      // Calculate weight difference from current history weight to target
      const weightDifference = currentWeightFromHistory - user.targetWeight;
      const isLosingWeight = weightDifference > 0;
      
      // Calculate actual weight change from starting weight to current history weight
      const actualWeightChange = currentWeightFromHistory - startingWeight;
      
      // Calculate total weight change needed from starting point to goal
      const totalWeightChangeNeeded = startingWeight - user.targetWeight;
      
      // Calculate progress as percentage of journey completed
      let progressToGoal = 0;
      if (totalWeightChangeNeeded !== 0) {
        if (isLosingWeight) {
          // For weight loss: positive progress = losing weight toward goal
          progressToGoal = Math.max(0, Math.min(100, (actualWeightChange / totalWeightChangeNeeded) * 100));
        } else {
          // For weight gain: positive progress = gaining weight toward goal
          progressToGoal = Math.max(0, Math.min(100, (Math.abs(actualWeightChange) / Math.abs(totalWeightChangeNeeded)) * 100));
        }
      } else {
        // If starting weight equals target weight, they're already at goal
        progressToGoal = 100;
      }

      // Calculate days since joining
      const daysSinceJoining = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      // Calculate average workouts per week
      const weeksSinceJoining = Math.max(1, Math.floor(daysSinceJoining / 7));
      const averageWorkoutsPerWeek = totalWorkouts / weeksSinceJoining;

      // Find last workout
      const sortedWorkouts = user.workouts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastWorkout = sortedWorkouts[0];
      
      // Calculate days since last workout
      let daysSinceLastWorkout = null;
      let lastWorkoutDate = null;
      let lastWorkoutTitle = null;
      let lastWorkoutSetsCompleted = null;
      
      if (lastWorkout) {
        lastWorkoutDate = lastWorkout.date;
        lastWorkoutTitle = lastWorkout.title;
        lastWorkoutSetsCompleted = lastWorkout.totalSetsCompleted;
        
        // Parse the date string to calculate days since
        const lastWorkoutTime = new Date(lastWorkout.date).getTime();
        daysSinceLastWorkout = Math.floor((Date.now() - lastWorkoutTime) / (1000 * 60 * 60 * 24));
      }

      // Calculate weight change from most recent to previous weight in history
      let weightChangeFromLastWorkout = null;
      if (weightHistory.length >= 2) {
        const mostRecentWeight = weightHistory[weightHistory.length - 1].weight;
        const previousWeight = weightHistory[weightHistory.length - 2].weight;
        weightChangeFromLastWorkout = mostRecentWeight - previousWeight;
      }

      // Calculate streak (consecutive days with workouts)
      let currentStreak = 0;
      if (sortedWorkouts.length > 0) {
        const today = new Date();
        let checkDate = new Date(today);
        
        for (let i = 0; i < sortedWorkouts.length; i++) {
          const workoutDate = new Date(sortedWorkouts[i].date);
          const daysDiff = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0 || daysDiff === 1) {
            currentStreak++;
            checkDate = new Date(workoutDate);
          } else {
            break;
          }
        }
      }

      return {
        userName: user.userName,
        currentWeight: currentWeightFromHistory,
        targetWeight: user.targetWeight,
        weightDifference: Math.abs(weightDifference),
        isLosingWeight,
        progressToGoal,
        totalWorkouts,
        totalSetsCompleted,
        workoutCompletionRate,
        daysSinceJoining,
        averageWorkoutsPerWeek,
        lastWorkoutDate,
        lastWorkoutTitle,
        lastWorkoutSetsCompleted,
        daysSinceLastWorkout,
        weightChangeFromLastWorkout,
        currentStreak,
        startingWeight,
        actualWeightChange,
        // Combined score for ranking (weight progress + workout consistency)
        combinedScore: (progressToGoal * 0.6) + (workoutCompletionRate * 0.4)
      };
    });

    // Sort by combined score (weight progress + workout consistency)
    leaderboardData.sort((a, b) => b.combinedScore - a.combinedScore);

    // Add rank to each user
    const rankedData = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    return NextResponse.json(rankedData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

