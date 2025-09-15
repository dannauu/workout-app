import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userName, email, password, currentWeight, targetWeight } = await request.json();
    
    if (!userName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { userName }] 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create weight history entry if currentWeight is provided
    const weightHistory = currentWeight ? [{
      weight: currentWeight,
      date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    }] : [];

    // Create new user
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      workouts: [],
      currentWeight: currentWeight || undefined,
      targetWeight: targetWeight || undefined,
      weightHistory
    });

    await newUser.save();

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
