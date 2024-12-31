'use client';  // This is needed to enable client-side logic

import React, { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (username) => {
    setLoading(true); // Set loading to true when the registration process starts

    try {
      // Fetching registration options from the backend
      const optionsResponse = await fetch('/api/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to fetch registration options');
      }

      const options = await optionsResponse.json();

      // Starting the WebAuthn registration process
      const attestationResponse = await startRegistration(options);

      // Sending attestation response to backend for verification
      const verificationResponse = await fetch('/api/webauthn/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          attestationResponse,
        }),
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to verify registration');
      }

      const result = await verificationResponse.json();
      if (result.success) {
        setMessage('Registration successful!');
      } else {
        setMessage('Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false); // Set loading to false once the process is complete
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegister(username); // Call handleRegister when the form is submitted
  };

  return (
    <div>
      <h1>Register with WebAuthn</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default RegisterPage;
