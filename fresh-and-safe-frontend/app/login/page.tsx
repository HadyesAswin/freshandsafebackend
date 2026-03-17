"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [view, setView] = useState<"login" | "resetPassword">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("Idle");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInput = (setter: (val: string) => void, val: string) => {
    setStatus("Idle");
    setter(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Connecting...");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post("http://localhost:8000/api/v1/login/access-token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("admin_token", response.data.access_token);
      setStatus("✅ Success! Redirecting...");

      setTimeout(() => {
        router.replace("/admin");
      }, 500);

    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 400) {
        setStatus("❌ Incorrect email or password.");
      } else if (!err.response) {
        setStatus("❌ Server unreachable. Is backend running?");
      } else {
        setStatus("❌ " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    setLoading(true);
    setStatus("Sending OTP...");

    try {
      const res = await axios.post("http://localhost:8000/api/v1/login/admin/forgot-password");
      setView("resetPassword");
      setStatus(`✅ ${res.data.message}`);
    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.detail || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Resetting...");

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await axios.post("http://localhost:8000/api/v1/login/admin/reset-password", {
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setStatus("✅ Password reset! You can now login.");
      setView("login");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err: any) {
      setStatus("❌ " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      {/* Background Pattern */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f910_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f910_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00b8d9]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/FRESH & SAFE LOGO.png"
            alt="Fresh & Safe"
            width={180}
            height={80}
            style={{ width: '100px', height: 'auto' }}
            className="object-contain"
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10">

          {/* Header */}
          <div className="text-center mb-8">

            <h1 className="text-xl font-extrabold text-slate-900 mb-1">
              {view === "login" ? "Admin Login" : "Reset Password"}
            </h1>
            <p className="text-slate-400 text-xs">
              {view === "login"
                ? "Enter your credentials to access the dashboard."
                : "Enter the OTP sent to your admin email."}
            </p>
          </div>

          {/* VIEW 1: LOGIN */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => handleInput(setEmail, e.target.value)}
                    placeholder="admin@freshandsafe.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => handleInput(setPassword, e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#00b8d9] hover:bg-[#00a2bf] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : "Sign In"}
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  disabled={loading}
                  className="text-xs font-bold text-slate-400 hover:text-[#00b8d9] transition-colors disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: RESET PASSWORD */}
          {view === "resetPassword" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">OTP Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00b8d9] transition-all tracking-widest text-center placeholder:tracking-normal placeholder:text-slate-400 placeholder:font-semibold"
                    required
                    maxLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#00b8d9] transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#00b8d9] hover:bg-[#00a2bf] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : "Reset Password"}
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView("login"); setStatus("Idle"); }}
                  className="text-xs font-bold text-slate-400 hover:text-[#00b8d9] transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Status Message */}
          {status !== "Idle" && (
            <div className={`mt-6 text-xs font-bold text-center p-3 rounded-xl ${
              status.startsWith("❌") ? "bg-rose-50 text-rose-600 border border-rose-100" :
              status.startsWith("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
              "bg-slate-50 text-slate-500 border border-slate-100"
            }`}>
              {status}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}