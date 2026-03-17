"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function ShopLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post(
        "http://localhost:8000/api/v1/login/outlet-access-token",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const token = response.data.access_token;

      if (!token) {
        setError("Login failed: No token received.");
        setLoading(false);
        return;
      }

      const decoded: any = jwtDecode(token);

      if (!decoded.sub) {
        setError("Invalid token: Outlet ID missing.");
        setLoading(false);
        return;
      }

      localStorage.setItem("outlet_token", token);
      localStorage.setItem("outlet_id", decoded.sub);

      router.replace("/outlet-home");

    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Server connection failed";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f910_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f910_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl"></div>
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
            <h1 className="text-xl font-extrabold text-slate-900 mb-1">Outlet Login</h1>
            <p className="text-slate-400 text-xs">Sign in to manage your outlet dashboard.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold text-center p-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="outlet@freshandsafe.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400"
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
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-12 text-sm font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder:text-slate-400"
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
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : "Sign In to Outlet"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
          Not an outlet partner?{" "}
          <a href="/" className="font-bold text-emerald-500 hover:text-emerald-600 transition-colors">
            Go to Main Site
          </a>
        </p>
      </div>
    </div>
  );
}