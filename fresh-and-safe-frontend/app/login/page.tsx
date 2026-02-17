"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <--- ✅ THIS WAS MISSING

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@freshtohome.com");
  const [password, setPassword] = useState("admin123");
  const [status, setStatus] = useState("Idle");

  // Helper to clear errors when user types
  const handleInput = (setter: (val: string) => void, val: string) => {
    setStatus("Idle"); // ✅ Clear error message as soon as user types
    setter(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Connecting to Backend...");

    try {
      // 1. Prepare data
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      // 2. Send Request
      const response = await axios.post("http://localhost:8000/api/v1/login/access-token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // 3. Success
      localStorage.setItem("token", response.data.access_token);
      setStatus("✅ Success! Redirecting...");
      
      // Short delay to let user see success message before redirect
      setTimeout(() => {
        router.push("/admin");
      }, 500);

    } catch (err: any) {
      console.error(err);
      
      // ✅ Handle specific 400 error (Incorrect Credentials)
      if (err.response && err.response.status === 400) {
        setStatus("❌ Incorrect email or password. Please try again.");
      } 
      // Handle Server Down / Network Error
      else if (!err.response) {
        setStatus("❌ Server is unreachable. Is backend running?");
      } 
      // Handle other errors
      else {
        setStatus("❌ Login Failed: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-green-600">Backend Connection Test</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            className="w-full border p-2 rounded" 
            value={email} 
            onChange={e => handleInput(setEmail, e.target.value)} // ✅ Clears error on type
            placeholder="Email" 
          />
          <input 
            className="w-full border p-2 rounded" 
            type="password" 
            value={password} 
            onChange={e => handleInput(setPassword, e.target.value)} // ✅ Clears error on type
            placeholder="Password" 
          />
          
          <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition">
            Test Connection
          </button>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-green-600 hover:underline">
                Forgot Password?
            </Link>
          </div>
        </form>
        
        {/* Status Message Area */}
        <p className={`mt-4 text-sm font-bold text-center p-2 rounded ${
          status.startsWith("❌") ? "bg-red-100 text-red-600" : 
          status.startsWith("✅") ? "bg-green-100 text-green-700" : 
          "text-gray-600"
        }`}>
          {status}
        </p>
      </div>
    </div>
  );
}