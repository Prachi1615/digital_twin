'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!username.trim()) {
        setMessage('Username cannot be empty.');
        setLoading(false);
        return;
      }

      // Get authentication options from the server
      const optionsResponse = await fetch('/api/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch authentication options.');
      }

      const options = await optionsResponse.json();

      // Start WebAuthn authentication on the client
      const authenticationResponse = await startAuthentication(options);

      // Send the authentication response back to the server for verification
      const verificationResponse = await fetch('/api/webauthn/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: authenticationResponse }),
      });

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        throw new Error(errorData.error || 'Failed to verify authentication.');
      }

      const verificationResult = await verificationResponse.json();

      setMessage(
        verificationResult.success
          ? 'Login successful! Welcome back.'
          : `Login failed: ${verificationResult.error || 'Unknown error'}`
      );
    } catch (err) {
      console.error(err);
      setMessage(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="p-6 bg-white shadow-md rounded-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Login with Biometrics</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
