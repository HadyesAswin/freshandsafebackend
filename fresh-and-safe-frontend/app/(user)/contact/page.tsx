"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Loader2, 
  ArrowLeft 
} from "lucide-react";

interface ContactDetail {
  id: number;
  title: string;
  email: string;
  phone: string;
  description?: string;
}

export default function ContactPage() {
  const [details, setDetails] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/contact");
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
        }
      } catch (err) {
        console.error("Failed to fetch contact info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContactDetails();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/v1/user/contact-info/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const errorData = await res.json();
        alert("Failed to send: " + (errorData.detail || "Error"));
      }
    } catch (error) {
      alert("An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#00b8d9]/20 selection:text-[#00b8d9]">
      
      {/* HEADER NAVBAR - Synced Style */}
      

      {/* PAGE CONTENT CONTAINER */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10 md:py-16">
        
        {/* PAGE HEADER */}
        <header className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text">
            Get in Touch
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
            Have a question about an order or our fresh products? Reach out to our team below.
          </p>
        </header>

        {/* MASTER GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: Contact Details (col-span-3) */}
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="md:sticky md:top-32 space-y-10">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Our Offices
              </h2>
              
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#00b8d9]" />
              ) : (
                <div className="space-y-10">
                  {details.map((office) => (
                    <div key={office.id} className="space-y-4">
                      <p className="text-xs font-bold text-[#00b8d9] uppercase tracking-widest border-l-2 border-[#00b8d9] pl-3">
                        {office.title}
                      </p>
                      
                      <div className="space-y-3 pl-3">
                        <div className="flex items-center gap-3 group">
                          <Mail className="w-4 h-4 text-gray-400 group-hover:text-[#00b8d9] transition-colors" />
                          <a href={`mailto:${office.email}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            {office.email}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">{office.phone}</span>
                        </div>

                        {office.description && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {office.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: Contact Form (col-span-9) */}
          <div className="md:col-span-8 lg:col-span-9">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#00b8d9] focus:border-[#00b8d9] transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#00b8d9] focus:border-[#00b8d9] transition-all"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What is this regarding?" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#00b8d9] focus:border-[#00b8d9] transition-all"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Message</label>
                <textarea 
                  rows={6}
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Type your message here..." 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#00b8d9] focus:border-[#00b8d9] transition-all resize-none"
                ></textarea>
              </div>

              <div className="sm:col-span-2 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-fit px-12 py-4 bg-[#00b8d9] text-white font-bold rounded-xl hover:bg-[#009ab5] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 shadow-lg shadow-[#00b8d9]/20"
                >
                  {isSubmitting ? (
                    <>Sending... <Loader2 className="w-4 h-4 animate-spin" /></>
                  ) : (
                    <>Send Message <Send className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </main>
  );
}