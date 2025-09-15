# MongoDB Setup for Workout App

This app now uses MongoDB instead of localStorage to persist workout data. Follow these steps to set up MongoDB.

## Option 1: Local MongoDB Installation

### Install MongoDB Community Edition

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Start MongoDB service

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Verify Installation
```bash
mongosh
```

## Option 2: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env.local` with your Atlas connection string

## Environment Configuration

The app uses the following environment variables in `.env.local`:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/workout-app

# For MongoDB Atlas (replace with your actual connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workout-app?retryWrites=true&w=majority
```

## Database Schema

The app creates two collections:

### WeightRecord
- `userId`: String (unique identifier for user)
- `exerciseName`: String (name of the exercise)
- `weight`: Number (weight used)
- `date`: Date (when the weight was recorded)
- `createdAt`: Date (record creation timestamp)
- `updatedAt`: Date (record update timestamp)

### WorkoutSession
- `userId`: String (unique identifier for user)
- `day`: String (day of the week)
- `date`: Date (date of the workout)
- `exercises`: Array of exercise objects
- `completed`: Boolean (whether workout was completed)
- `createdAt`: Date (record creation timestamp)
- `updatedAt`: Date (record update timestamp)

## API Endpoints

The app provides the following API endpoints:

- `POST /api/weights` - Save a weight record
- `GET /api/weights` - Get weight records for a user
- `GET /api/weights/current` - Get current day's weight for an exercise
- `GET /api/weights/last-week` - Get last week's weight for an exercise

## Running the App

1. Make sure MongoDB is running
2. Update `.env.local` with your MongoDB connection string
3. Start the development server:
```bash
npm run dev
```

## Data Migration

If you have existing data in localStorage, you can manually migrate it by:
1. Opening browser dev tools
2. Going to Application > Local Storage
3. Copying the workout data
4. Using the app to re-enter the weights (they'll be saved to MongoDB)

## Troubleshooting

### Connection Issues
- Verify MongoDB is running: `mongosh` should connect
- Check your connection string in `.env.local`
- Ensure your IP is whitelisted (for Atlas)

### Permission Issues
- Make sure MongoDB has proper permissions
- Check firewall settings
- Verify database user permissions (for Atlas)

### Development Issues
- Restart the Next.js development server after changing environment variables
- Clear browser cache if you see old localStorage data
- Check browser console for API errors
