import mongoose from 'mongoose';

let isConnected = false;

export default async function connectToDatabase() {
  if (isConnected) return;

  const db = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = db.connections[0].readyState === 1;
}
