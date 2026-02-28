"use client";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  PhoneCall, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2 
} from "lucide-react";

function ContactFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    title: "", 
    email: "", 
    phone: "", 
    description: "" 
  });

  useEffect(() => {
    if (editingId) {
      axios.get("http://localhost:8000/api/v1/contact/").then(res => {
        const item = res.data.find((x: any) => x.id === parseInt(editingId));
        if (item) setFormData({ 
            title: item.title, 
            email: item.email, 
            phone: item.phone, 
            description: item.description 
        });
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const url = editingId ? `http://localhost:8000/api/v1/contact/${editingId}` : "http://localhost:8000/api/v1/contact/";
      await axios({ 
        method: editingId ? "put" : "post", 
        url, 
        data: formData, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      router.push("/admin/contact");
    } catch (err) { 
      alert("Error saving contact details"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Standardized styling classes
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3 pl-10";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-red-600" />
            {editingId ? "Update Contact Branch" : "Add Contact Branch"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editingId ? "Modify the details of this contact location." : "Create a new contact location or support channel."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        {/* Branch Title */}
        <div>
          <label className={labelClass}>Branch / Office Title</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Building2 className="w-4 h-4" />
            </span>
            <input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className={inputClass} 
              placeholder="e.g. Headquarters, Support Desk" 
              required 
            />
          </div>
        </div>

        {/* Contact Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className={inputClass} 
                placeholder="e.g. support@yourstore.com" 
                required 
              />
            </div>
          </div>
          
          <div>
            <label className={labelClass}>Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Phone className="w-4 h-4" />
              </span>
              <input 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className={inputClass} 
                placeholder="e.g. +91 98765 43210" 
                required 
              />
            </div>
          </div>
        </div>

        {/* Address / Description */}
        <div>
          <label className={labelClass}>Physical Address / Additional Info</label>
          <div className="relative">
            <span className="absolute top-3.5 left-0 flex items-center pl-3 text-gray-400">
              <MapPin className="w-4 h-4" />
            </span>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className={`${inputClass} min-h-[120px] resize-y leading-relaxed`} 
              placeholder="Enter the full office address or operating hours..." 
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingId ? "Update Contact Info" : "Save Contact Info"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddContactPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <ContactFormContent />
    </Suspense>
  );
}