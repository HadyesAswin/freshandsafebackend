"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@freshtohome.com");
  const [password, setPassword] = useState("admin123");
  const [status, setStatus] = useState("Idle");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Connecting to Backend...");

    try {
      // 1. Prepare the data for FastAPI (OAuth2 expects form data)
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      // 2. The Bridge: Send data to localhost:8000
      const response = await axios.post("http://localhost:8000/api/v1/login/access-token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // 3. Success! Save the "ID Card" (Token)
      localStorage.setItem("token", response.data.access_token);
    //   setStatus("✅ Success! Redirecting...");
        router.push("/admin");
      
      // 4. Move to the Admin Page (We will build this next)
      // router.push("/admin"); 
      alert("Login Successful! Token received: " + response.data.access_token.substring(0, 10) + "...");

    } catch (err: any) {
      console.error(err);
      setStatus("❌ Connection Failed: " + (err.response?.data?.detail || "Server Refused Connection"));
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
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
          />
          <input 
            className="w-full border p-2 rounded" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
          />
          <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
            Test Connection
          </button>
        </form>
        <p className="mt-4 text-sm font-mono text-gray-600">{status}</p>
      </div>
    </div>
  );
}