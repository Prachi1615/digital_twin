// app/api/webauthn/verify-login/route.js

import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/users';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, response } = body;

    if (!username || !response) {
      console.error('Invalid request: Missing username or response.');
      return new Response(JSON.stringify({ error: 'Invalid request: Missing username or response.' }), { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ username });

    if (!user || user.devices.length === 0) {
      console.error(`User "${username}" not found or no registered devices.`);
      return new Response(JSON.stringify({ error: 'User not found or no registered devices.' }), { status: 404 });
    }

    const expectedChallenge = user.currentChallenge;

    if (!expectedChallenge) {
      console.error('No challenge found for user.');
      return new Response(JSON.stringify({ error: 'No challenge found for user.' }), { status: 400 });
    }

    const rpID = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost';
    const origin = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000';

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: user.devices.find(
          (device) => device.credentialID === response.id
        ),
      });

      if (verification.verified) {
        const { authenticationInfo } = verification;

        // Update authenticator counter to prevent replay attacks
        const device = user.devices.find(
          (device) => device.credentialID === response.id
        );
        if (device) {
          device.counter = authenticationInfo.newCounter;
        }

        // Clear the current challenge
        user.currentChallenge = undefined;

        await user.save();

        console.log(`User "${username}" authenticated successfully.`);
        return new Response(JSON.stringify({ success: true, message: 'Login successful!' }), { status: 200 });
      }

      console.error('Authentication verification failed.');
      return new Response(JSON.stringify({ error: 'Authentication verification failed.' }), { status: 400 });
    } catch (error) {
      console.error('Error during authentication verification:', error);
      return new Response(JSON.stringify({ error: 'Internal server error during verification.' }), { status: 500 });
    }
  } catch (error) {
    console.error('Error processing authentication verification request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), { status: 500 });
  }
}
