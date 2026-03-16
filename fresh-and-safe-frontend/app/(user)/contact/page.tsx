"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Loader2, 
  MessageSquare, 
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
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Added loading state for form

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/contact-info");
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

  // ✅ Updated to send data to the backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/v1/contact-info/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Message sent successfully! We will get back to you soon.");
        setFormData({ name: "", email: "", subject: "", message: "" }); // Clear form
      } else {
        const errorData = await res.json();
        alert("Failed to send message: " + (errorData.detail || "Please try again later."));
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Have a question about an order or our fresh products? Reach out to our team below.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT: Managed Contact Details */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Offices</h2>
            
            {loading ? (
              <div className="flex items-center gap-3 text-gray-400 py-10">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading details...</span>
              </div>
            ) : details.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border text-sm text-gray-500 italic">
                Contact information is currently being updated.
              </div>
            ) : (
              details.map((office) => (
                <div key={office.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-black text-green-700 mb-4 uppercase tracking-tight border-b pb-2">
                    {office.title}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Email Us</p>
                        <a href={`mailto:${office.email}`} className="text-gray-700 font-semibold hover:text-blue-600 transition-colors">
                          {office.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Call Us</p>
                        <p className="text-gray-700 font-semibold">{office.phone}</p>
                      </div>
                    </div>

                    {office.description && (
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Find Us</p>
                          <p className="text-gray-600 text-sm leading-relaxed">{office.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
              </div>

              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What is this regarding?" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Message</label>
                  <textarea 
                    rows={5}
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Type your message here..." 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full md:w-fit px-12 py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
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
      </div>
    </main>
  );
}