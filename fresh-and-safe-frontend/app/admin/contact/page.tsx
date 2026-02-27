"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  PhoneCall, 
  Mail, 
  Phone, 
  Building2,
  MapPin,
  Contact
} from "lucide-react";

export default function ContactListPage() {
  const [contacts, setContacts] = useState([]);
  const router = useRouter();

  const fetchContacts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/contact/");
      setContacts(res.data);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this contact section?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/contact/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchContacts();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-red-600" />
            Contact Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your branch locations, support emails, and phone numbers.</p>
        </div>
        <Link 
          href="/admin/contact/add" 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Contact Branch
        </Link>
      </div>

      {/* Grid Container */}
      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Contact className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No contact details found. Add your first branch or support line!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((c: any) => (
            <div 
              key={c.id} 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-red-200 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100/50">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">{c.title}</h2>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => router.push(`/admin/contact/add?id=${c.id}`)} 
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Edit Contact"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)} 
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-grow mt-2">
                {c.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                
                {c.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}

                {c.description && (
                  <div className="flex items-start gap-3 text-sm text-gray-600 pt-2 border-t border-gray-50 mt-2">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-3 leading-relaxed">{c.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}