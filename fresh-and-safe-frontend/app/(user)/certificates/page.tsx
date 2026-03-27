"use client";

import { useState, useEffect } from "react";
import { Award, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

// ✅ Updated interface to match your actual database
interface Certificate {
  id: number;
  image: string | null;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/certificates/certificates");
        if (res.ok) {
          const data = await res.json();
          setCertificates(data);
        }
      } catch (error) {
        console.error("Failed to load certificates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Our Certifications & Accreditations
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            At Fresh & Safe, your health and trust are our highest priorities. 
            We strictly adhere to industry-leading quality and hygiene standards.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#00b8d9]" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Loading Certificates...
            </span>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed max-w-2xl mx-auto">
            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Certificates Found</h3>
            <p className="text-slate-500 mb-6">We are currently updating our certification records.</p>
            <Link href="/" className="text-[#00b8d9] font-bold hover:underline">
              ← Return to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div 
                key={cert.id} 
                className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group flex items-center justify-center cursor-pointer"
              >
                {/* Pure Image Focus */}
                <div className="aspect-[4/3] w-full relative overflow-hidden rounded-2xl flex items-center justify-center">
                  {cert.image ? (
                    <img 
                      src={`http://localhost:8000${cert.image}`} 
                      alt="Fresh & Safe Certificate" 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="bg-slate-50 w-full h-full flex flex-col items-center justify-center">
                      <Award className="w-10 h-10 text-slate-300 mb-2" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Image Missing</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}