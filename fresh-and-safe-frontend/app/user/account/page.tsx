"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/"); // redirect if not logged in
      return;
    }
    setUser(JSON.parse(storedUser));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-6 flex gap-10">

        {/* LEFT SIDEBAR */}
        <div className="w-64 bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold mb-6">My Account</h2>

          <button className="block w-full text-left font-semibold text-green-600">
            Account Dashboard
          </button>

          <button className="block w-full text-left hover:text-green-600">
            Address Book
          </button>

          <button className="block w-full text-left hover:text-green-600">
            My Orders
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              router.push("/");
            }}
            className="block w-full text-left text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-8">

          <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>

          {/* Account Info */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>

            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <p className="font-semibold">{user.name || "Not provided"}</p>
                <p className="text-gray-600">{user.phone}</p>
                <p className="text-gray-600">{user.email || "Not provided"}</p>
              </div>

              <button className="text-green-600 font-semibold">
                Edit
              </button>
            </div>
          </div>

          {/* Address Section */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4">Address Book</h3>

            <div className="flex justify-between border-b pb-4">
              <div>
                <p className="font-semibold">Default Shipping Address</p>
                <p className="text-gray-500">
                  You have not set a shipping address.
                </p>
              </div>

              <button className="text-green-600 font-semibold">
                Edit
              </button>
            </div>
          </div>

          {/* SMS Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">SMS</h3>

            <div className="flex justify-between border-b pb-4">
              <div>
                <p className="text-gray-600">
                  You are currently subscribed to SMS notifications.
                </p>
              </div>

              <button className="text-green-600 font-semibold">
                Edit
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
