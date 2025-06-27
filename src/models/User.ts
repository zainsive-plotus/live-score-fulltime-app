import mongoose, { Schema, models, model } from 'mongoose';

export interface IUser extends mongoose.Document {
  name?: string;
  email: string;
  image?: string;
  password?: string; // Add password field
  role: 'user' | 'admin'; // Add role field
  favoriteTeams?: number[];
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  image: String,
  // CRITICAL: Never return the password hash by default in queries
  password: {
    type: String,
    select: false, 
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  favoriteTeams: {
    type: [Number],
    default: [],
  },
}, { timestamps: true });

const User = models.User || model<IUser>('User', UserSchema);
export default User;