"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // Steps: 1 = Enter Email, 2 = Enter OTP & New Password
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);

  // --- Step 1: Request OTP ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Sending OTP...");

    try {
      await axios.post("http://localhost:8000/api/v1/login/forgot-password", { email });
      setStep(2); // Move to next step
      setStatus("✅ OTP Sent! Check your server console (or email).");
    } catch (err: any) {
      setStatus("❌ Failed: " + (err.response?.data?.detail || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Reset Password ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Resetting Password...");

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await axios.post("http://localhost:8000/api/v1/login/reset-password", {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setStatus("✅ Success! Password Reset.");
      setTimeout(() => router.push("/login"), 2000); // Redirect to Login

    } catch (err: any) {
        setStatus("❌ Failed: " + (err.response?.data?.detail || err.message));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-100">
        <h1 className="text-2xl font-bold mb-2 text-green-700">Forgot Password?</h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === 1 ? "Enter your email to receive a code." : "Check your email/console for the code."}
        </p>

        {/* --- FORM STEP 1: Email --- */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input
              className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
            />
            <button 
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold transition"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* --- FORM STEP 2: OTP & Password --- */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              className="w-full border px-4 py-2 rounded-lg bg-gray-50"
              type="email"
              value={email}
              disabled
            />
            <input
              className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none tracking-widest text-center font-bold"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              required
              maxLength={6}
            />
            <input
              className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
            />
            <input
              className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
            <button 
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold transition"
            >
              {loading ? "Processing..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Status Message */}
        {status !== "Idle" && (
           <div className={`mt-4 text-center text-sm font-bold p-2 rounded ${
             status.includes("❌") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
           }`}>
             {status}
           </div>
        )}

        <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-green-600 transition">
                ← Back to Login
            </Link>
        </div>
      </div>
    </div>
  );
}