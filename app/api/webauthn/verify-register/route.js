import { verifyRegistrationResponse } from '@simplewebauthn/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/users';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, attestationResponse } = body;

    if (!username || !attestationResponse) {
      return new Response(JSON.stringify({ error: 'Username and attestation response are required.' }), { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ username });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), { status: 404 });
    }

    const expectedChallenge = user.currentChallenge;
    if (!expectedChallenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found or expired.' }), { status: 400 });
    }

    // Verify the registration response with the expected challenge
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
      expectedRPID: process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost',
    });

    if (verification.verified) {
      user.devices.push(verification.registrationInfo);  // Add the device info to the user's record
      delete user.currentChallenge; // Clean up the challenge after successful registration
      await user.save();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'Verification failed.' }), { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying registration:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), { status: 500 });
  }
}
