import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['investor', 'admin', 'analyst'], default: 'investor' },
  investorPortfolio: [{ type: String }]
});

const User = models.User || model('User', UserSchema);
export default User;
