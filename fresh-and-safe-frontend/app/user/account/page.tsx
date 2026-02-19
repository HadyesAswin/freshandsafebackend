"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "addresses">("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Edit Address State
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const router = useRouter();

  const fetchUserData = async (userId: int) => {
    setLoadingData(true);
    try {
      const [ordersRes, addrRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/orders/my-orders/${userId}`),
        fetch(`http://localhost:8000/api/v1/orders/my-addresses/${userId}`)
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (addrRes.ok) setAddresses(await addrRes.json());
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/"); return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchUserData(parsedUser.id);
  }, [router]);

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/addresses/${editingAddress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAddress)
      });
      if (res.ok) {
        alert("Address Updated Successfully!");
        setEditingAddress(null);
        fetchUserData(user.id); // Refresh addresses
      } else {
        alert("Failed to update address.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600">Fresh<span className="text-slate-800">&Safe</span></Link>
          <Link href="/" className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors">← Back to Store</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">

        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border p-6 space-y-2 h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-800">My Account</h2>
          <button onClick={() => {setActiveTab("dashboard"); setEditingAddress(null)}} className={`block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${activeTab === "dashboard" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>Account Dashboard</button>
          <button onClick={() => {setActiveTab("orders"); setEditingAddress(null)}} className={`block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors flex justify-between items-center ${activeTab === "orders" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
            My Orders {orders.length > 0 && <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{orders.length}</span>}
          </button>
          <button onClick={() => setActiveTab("addresses")} className={`block w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${activeTab === "addresses" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>Address Book</button>
          <hr className="my-4 border-gray-100" />
          <button onClick={() => { localStorage.clear(); router.push("/"); }} className="block w-full text-left px-4 py-3 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors">Logout</button>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-8 min-h-[500px]">

          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-black mb-8 text-gray-800">Welcome, {user.name || "User"}!</h1>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">Profile Information</h3>
                  <p className="font-semibold text-gray-800">{user.name || "Not provided"}</p>
                  <p className="text-gray-600 mt-1">📞 {user.phone}</p>
                  <p className="text-gray-600 mt-1">✉️ {user.email || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-black mb-6 text-gray-800">My Orders</h1>
              {loadingData ? <p>Loading orders...</p> : orders.length === 0 ? <p>No orders yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm border-b border-t">
                        <th className="p-4 font-bold">Order ID</th>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Total</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-semibold text-gray-800">{order.order_number}</td>
                          <td className="p-4 text-gray-600">{order.date}</td>
                          <td className="p-4 font-bold text-gray-800">₹{order.total_amount}</td>
                          <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">{order.status.toUpperCase()}</span></td>
                          
                          {/* ✅ NEW: View Details Button */}
                          <td className="p-4 text-right">
                            <Link href={`/user/order/${order.order_number}`} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-200 transition">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESS BOOK */}
          {activeTab === "addresses" && (
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-black mb-6 text-gray-800">Address Book</h1>
              
              {editingAddress ? (
                // ✅ NEW: Edit Address Form
                <div className="bg-gray-50 p-6 rounded-xl border">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Edit Address</h3>
                  <form onSubmit={handleUpdateAddress} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Full Name" value={editingAddress.name} onChange={e => setEditingAddress({...editingAddress, name: e.target.value})} className="border p-3 rounded-lg outline-none" required />
                      <input type="text" placeholder="Phone" value={editingAddress.phone} onChange={e => setEditingAddress({...editingAddress, phone: e.target.value})} className="border p-3 rounded-lg outline-none" required />
                    </div>
                    <input type="text" placeholder="Address Line 1" value={editingAddress.address_line1} onChange={e => setEditingAddress({...editingAddress, address_line1: e.target.value})} className="border w-full p-3 rounded-lg outline-none" required />
                    <input type="text" placeholder="Address Line 2 (Optional)" value={editingAddress.address_line2 || ""} onChange={e => setEditingAddress({...editingAddress, address_line2: e.target.value})} className="border w-full p-3 rounded-lg outline-none" />
                    <div className="grid grid-cols-3 gap-4">
                      <input type="text" placeholder="City" value={editingAddress.city} onChange={e => setEditingAddress({...editingAddress, city: e.target.value})} className="border p-3 rounded-lg outline-none" required />
                      <input type="text" placeholder="State" value={editingAddress.state} onChange={e => setEditingAddress({...editingAddress, state: e.target.value})} className="border p-3 rounded-lg outline-none" required />
                      <input type="text" placeholder="Zipcode" value={editingAddress.zipcode} onChange={e => setEditingAddress({...editingAddress, zipcode: e.target.value})} className="border p-3 rounded-lg outline-none" required />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700">Save Changes</button>
                      <button type="button" onClick={() => setEditingAddress(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300">Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                // Display Addresses
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="border rounded-xl p-5 hover:border-green-500 transition-colors relative">
                      
                      {/* ✅ Edit Button */}
                      <button 
                        onClick={() => setEditingAddress(addr)} 
                        className="absolute top-4 right-4 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full hover:bg-green-100"
                      >
                        Edit
                      </button>

                      <p className="font-bold text-gray-800 mb-1">{addr.name}</p>
                      <p className="text-gray-500 text-sm mb-3 font-medium">📞 {addr.phone}</p>
                      <p className="text-gray-600 text-sm">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-gray-600 text-sm">{addr.address_line2}</p>}
                      <p className="text-gray-600 text-sm">{addr.city}, {addr.state}</p>
                      <p className="text-gray-600 font-bold mt-2">PIN: {addr.zipcode}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}