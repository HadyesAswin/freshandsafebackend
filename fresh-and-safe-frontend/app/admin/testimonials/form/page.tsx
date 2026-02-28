"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  MapPin, 
  Hash, 
  Save, 
  Loader2, 
  Info,
  CheckCircle2,
  Quote
} from "lucide-react";

function TestimonialFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load testimonial for edit
  useEffect(() => {
    if (!id) return;

    axios
      .get("http://localhost:8000/api/v1/testimonials/")
      .then((res) => {
        const item = res.data.find((t: any) => t.id === Number(id));
        if (item) {
          setName(item.name);
          setPlace(item.place || "");
          setDescription(item.description);
          setStatus(item.status);
          setDisplayOrder(item.display_order);
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");

    const data = new FormData();
    data.append("name", name);
    data.append("place", place);
    data.append("description", description);
    data.append("status", String(status));
    data.append("display_order", String(displayOrder));
    if (photo) data.append("photo", photo);

    try {
      await axios({
        method: isEdit ? "put" : "post",
        url: isEdit
          ? `http://localhost:8000/api/v1/testimonials/${id}`
          : "http://localhost:8000/api/v1/testimonials/",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/admin/testimonials");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  // Standardized styling classes
  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white outline-none transition-all p-3";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500">
      
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
            <MessageSquare className="w-6 h-6 text-red-600" />
            {isEdit ? "Edit Testimonial" : "Add Testimonial"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? "Update this customer review and display settings." : "Add a new customer testimonial to your website."}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Photo Upload Section */}
        <div>
          <label className={labelClass}>Customer Photo</label>
          <div className="mt-1 flex flex-col items-center justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors relative group cursor-pointer">
            <div className="space-y-2 text-center">
              <User className="mx-auto h-12 w-12 text-gray-300 group-hover:text-red-400 transition-colors" />
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer rounded-md font-bold text-red-600 hover:text-red-500 focus-within:outline-none">
                  <span>Upload Photo</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    required={!isEdit} 
                  />
                </label>
                <p className="pl-1 text-gray-500 font-medium">or drag and drop</p>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Profile Square Recommended (Max 2MB)</p>
              {photo && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 py-1.5 px-4 rounded-full border border-red-100 animate-in zoom-in-95">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {photo.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            <User className="w-4 h-4 text-red-500" />
            <h2>Customer Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Location / Place</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="e.g. Mumbai, India"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-50 pb-2">
            <Quote className="w-4 h-4 text-red-500" />
            <h2>The Feedback</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Testimonial Content</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder="Enter the customer's review here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`${labelClass} flex items-center gap-2`}>
                  <Hash className="w-3.5 h-3.5 text-red-500" /> 
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className={inputClass}
                  placeholder="e.g. 1"
                />
              </div>

              <div className="flex items-center justify-start md:justify-center h-full pt-4 md:pt-6">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} className="peer sr-only" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">Active Status</span>
                    <span className="block text-[10px] text-gray-400 uppercase tracking-tighter">Visible on Website</span>
                  </div>
                </label>
              </div>
            </div>
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
            {isEdit ? "Update Testimonial" : "Save Testimonial"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TestimonialFormPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <TestimonialFormContent />
    </Suspense>
  );
}