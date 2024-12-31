import { generateRegistrationOptions } from '@simplewebauthn/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/users';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer'; // Ensure Buffer is imported

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      console.error('Username is missing in request body.');
      return new Response(JSON.stringify({ error: 'Username is required.' }), { status: 400 });
    }

    await connectToDatabase();

    let user = await User.findOne({ username });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        username,
        userID: uuidv4(), // Still using uuidv4 to create userID, but we will convert it to Buffer
        devices: [],
      });
      await user.save();
    }

    // Convert userID to Buffer before passing it to generateRegistrationOptions
    const userID = Buffer.from(user.userID, 'utf8'); // Convert string userID to Buffer

    const rpID = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost';
    const origin = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000';

    // Await the registration options generation
    const options = await generateRegistrationOptions({
      rpName: process.env.NEXT_PUBLIC_RP_NAME || 'My WebAuthn App',
      rpID: rpID,
      userID,  // Pass Buffer userID here
      userName: user.username,
      attestationType: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Enforce biometric devices
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Log the generated options for debugging
    console.log('Generated registration options:', options);

    // Check if the challenge exists in the options
    if (!options.challenge) {
      console.error('Generated registration options are missing challenge.');
      return new Response(JSON.stringify({ error: 'Challenge generation failed.' }), { status: 500 });
    }

    // Save the challenge to the database
    user.currentChallenge = options.challenge;
    await user.save();

    return new Response(JSON.stringify(options), { status: 200 });
  } catch (error) {
    console.error('Error generating registration options:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), { status: 500 });
  }
}
