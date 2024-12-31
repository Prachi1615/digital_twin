// models/user.js

import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  credentialID: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, required: true },
  transports: { type: [String] }, // Optional
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  userID: { type: String, unique: true, required: true },
  devices: { type: [deviceSchema], default: [] },
  currentChallenge: { type: String }, // To store the current challenge
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
