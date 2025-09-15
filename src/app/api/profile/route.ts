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

    const user = await User.findById(session.user.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userName: user.userName,
      email: user.email,
      currentWeight: user.currentWeight,
      targetWeight: user.targetWeight,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentWeight, targetWeight } = await request.json();

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update weight fields
    if (currentWeight !== undefined) {
      user.currentWeight = currentWeight;
      
      // Add to weight history
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Check if we already have an entry for today
      const existingEntryIndex = user.weightHistory.findIndex((entry: any) => entry.date === today);
      
      if (existingEntryIndex !== -1) {
        // Update existing entry
        user.weightHistory[existingEntryIndex].weight = currentWeight;
      } else {
        // Add new entry
        user.weightHistory.push({
          date: today,
          weight: currentWeight
        });
      }
    }

    if (targetWeight !== undefined) {
      user.targetWeight = targetWeight;
    }

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      currentWeight: user.currentWeight,
      targetWeight: user.targetWeight,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
