// app/api/webauthn/login-options/route.js

import { generateAuthenticationOptions } from '@simplewebauthn/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/users';

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      console.error('Username is missing in request body.');
      return new Response(JSON.stringify({ error: 'Username is required.' }), { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ username });

    if (!user || user.devices.length === 0) {
      console.error(`User "${username}" not found or no registered devices.`);
      return new Response(JSON.stringify({ error: 'User not found or no registered devices.' }), { status: 400 });
    }

    const rpID = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost';
    const origin = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000';

    const options = generateAuthenticationOptions({
      allowCredentials: user.devices.map((device) => ({
        id: Buffer.from(device.credentialID, 'base64url'),
        type: 'public-key',
        transports: device.transports, // Optional: Specify transports if needed
      })),
      userVerification: 'preferred',
      timeout: 60000,
      rpID: rpID,
      // Additional options if needed
    });

    if (!options.challenge) {
      console.error('Generated authentication options are missing challenge.');
      return new Response(JSON.stringify({ error: 'Challenge generation failed.' }), { status: 500 });
    }

    // Save the challenge to the database
    user.currentChallenge = options.challenge;
    await user.save();

    console.log('Generated authentication options:', options);

    return new Response(JSON.stringify(options), { status: 200 });
  } catch (error) {
    console.error('Error generating login options:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), { status: 500 });
  }
}
