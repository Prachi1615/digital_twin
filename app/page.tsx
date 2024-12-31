export default function HomePage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to My App</h1>
        <p className="text-lg mb-6">Secure your account with WebAuthn!</p>
        <div className="flex space-x-4 justify-center">
          <a
            href="/register"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
          >
            Register
          </a>
          <a
            href="/login"
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
