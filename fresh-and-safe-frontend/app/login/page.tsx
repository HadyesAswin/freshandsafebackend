"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  
  // View State: 'login' -> 'resetPassword'
  const [view, setView] = useState<"login" | "resetPassword">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Idle");

  // Reset Password States
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to clear errors when user types
  const handleInput = (setter: (val: string) => void, val: string) => {
    setStatus("Idle");
    setter(val);
  };

  // --- 1. NORMAL LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      localStorage.setItem("admin_token", response.data.access_token);
      setStatus("✅ Success! Redirecting...");
      
      // Short delay to let user see success message before redirect
      setTimeout(() => {
        router.replace("/admin");
      }, 500);

    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        setStatus("❌ Incorrect email or password. Please try again.");
      } else if (!err.response) {
        setStatus("❌ Server is unreachable. Is backend running?");
      } else {
        setStatus("❌ Login Failed: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 2. TRIGGER ADMIN OTP DIRECTLY ---
  const handleForgotPasswordClick = async () => {
    setLoading(true);
    setStatus("Finding admin and sending OTP...");

    try {
      const res = await axios.post("http://localhost:8000/api/v1/login/admin/forgot-password");
      setView("resetPassword"); 
      setStatus(`✅ ${res.data.message}`); // Displays the masked email message
    } catch (err: any) {
      setStatus("❌ Failed: " + (err.response?.data?.detail || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  // --- 3. SUBMIT NEW PASSWORD ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Resetting Password...");

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await axios.post("http://localhost:8000/api/v1/login/admin/reset-password", {
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setStatus("✅ Success! Password Reset. You can now login.");
      setView("login"); 
      setPassword(""); // Clear old password from input
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err: any) {
      setStatus("❌ Failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        
        <h1 className="text-2xl font-bold mb-4 text-green-600">
          {view === "login" ? "Admin Login" : "Reset Admin Password"}
        </h1>
        
        {/* VIEW 1: NORMAL LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" 
              value={email} 
              onChange={e => handleInput(setEmail, e.target.value)} 
              placeholder="Email" 
              type="email"
              required
            />
            <input 
              className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" 
              type="password" 
              value={password} 
              onChange={e => handleInput(setPassword, e.target.value)} 
              placeholder="Password" 
              required
            />
            <button disabled={loading} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition disabled:opacity-50">
              {loading ? "Processing..." : "Login"}
            </button>
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={handleForgotPasswordClick}
                disabled={loading}
                className="text-sm text-green-600 hover:underline disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: VERIFY OTP & SET NEW PASSWORD */}
        {view === "resetPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none tracking-widest text-center font-bold"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              required
              maxLength={6}
            />
            <input
              className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
            />
            <input
              className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
            <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 font-bold transition">
              {loading ? "Processing..." : "Reset Password"}
            </button>
            <div className="flex justify-center mt-2">
              <button type="button" onClick={() => { setView("login"); setStatus("Idle"); }} className="text-sm text-gray-500 hover:text-green-600 transition">
                Cancel Reset
              </button>
            </div>
          </form>
        )}
        
        {/* Status Message Area */}
        <p className={`mt-4 text-sm font-bold text-center p-2 rounded ${
          status.startsWith("❌") ? "bg-red-100 text-red-600" : 
          status.startsWith("✅") ? "bg-green-100 text-green-700" : 
          status !== "Idle" ? "bg-gray-100 text-gray-600" : "hidden"
        }`}>
          {status}
        </p>
      </div>
    </div>
  );
}