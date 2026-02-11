"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContactListPage() {
  const [contacts, setContacts] = useState([]);
  const router = useRouter();

  const fetchContacts = async () => {
    const res = await axios.get("http://localhost:8000/api/v1/contact/");
    setContacts(res.data);
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this contact section?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:8000/api/v1/contact/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchContacts();
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Contact Management</h1>
        <Link href="/admin/contact/add" className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-cyan-700">
          + Add Contact Branch
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contacts.map((c: any) => (
          <div key={c.id} className="bg-white p-6 rounded-xl shadow border-l-4 border-cyan-500 flex justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{c.title}</h2>
              <p className="text-sm text-slate-600">📧 {c.email}</p>
              <p className="text-sm text-slate-600">📞 {c.phone}</p>
              <p className="text-xs text-slate-400 mt-2">{c.description}</p>
            </div>
            <div className="flex flex-col space-y-2">
              <button onClick={() => router.push(`/admin/contact/add?id=${c.id}`)} className="text-cyan-600 font-bold text-sm">Edit</button>
              <button onClick={() => handleDelete(c.id)} className="text-red-500 font-bold text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}