import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkoutSet {
  setNumber: number;
  reps: number;
  weight?: number;
  completed: boolean;
}

export interface IWorkoutExercise {
  name: string;
  sets: IWorkoutSet[];
}

export interface IWorkoutDay {
  date: string; // Format: "Monday September 15, 2025"
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  title: string;
  exercises: IWorkoutExercise[];
  completed: boolean;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  workoutDuration?: number; // in minutes
  notes?: string;
  bodyWeight?: number; // body weight recorded for this workout
}

export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  workouts: IWorkoutDay[];
  currentWeight?: number;
  targetWeight?: number;
  weightHistory: Array<{
    date: string;
    weight: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSetSchema = new Schema<IWorkoutSet>({
  setNumber: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const WorkoutExerciseSchema = new Schema<IWorkoutExercise>({
  name: {
    type: String,
    required: true
  },
  sets: [WorkoutSetSchema]
});

const WorkoutDaySchema = new Schema<IWorkoutDay>({
  date: {
    type: String,
    required: true,
    index: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  title: {
    type: String,
    required: true
  },
  exercises: [WorkoutExerciseSchema],
  completed: {
    type: Boolean,
    default: false
  },
  totalSetsCompleted: {
    type: Number,
    default: 0
  },
  totalSetsPlanned: {
    type: Number,
    default: 0
  },
  workoutDuration: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  bodyWeight: {
    type: Number,
    min: 0
  }
});

const WeightHistorySchema = new Schema({
  date: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  }
});

const UserSchema = new Schema<IUser>({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  workouts: [WorkoutDaySchema],
  currentWeight: {
    type: Number,
    min: 0
  },
  targetWeight: {
    type: Number,
    min: 0
  },
  weightHistory: [WeightHistorySchema]
}, {
  timestamps: true
});

// Indexes for efficient queries (removed duplicates since they're already defined in schema)

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
