"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RotateCcw, ArrowLeft } from "lucide-react";

interface RefundDocument {
  id: number;
  title: string;
  description: string;
  updated_at: string;
}

export default function RefundPolicyPage() {
  const [policies, setPolicies] = useState<RefundDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/user/refund-policy");
        if (res.ok) {
          const data = await res.json();
          setPolicies(data);
        }
      } catch (err) {
        console.error("Failed to fetch Refund Policy:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-gray-500 text-lg">Our commitment to your satisfaction and return process.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="font-medium">Loading details...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border text-center shadow-sm">
            <p className="text-gray-500 font-medium">Refund policy details are currently unavailable.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            {policies[0]?.updated_at && (
              <p className="text-sm text-gray-400 mb-8 border-b pb-4">
                Last Updated: <span className="font-semibold text-gray-600">{formatDate(policies[0].updated_at)}</span>
              </p>
            )}

            <div className="space-y-12">
              {policies.map((doc) => (
                <div key={doc.id}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{doc.title}</h2>
                  <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {doc.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}