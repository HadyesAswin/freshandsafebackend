"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetails() {
  const { order_id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem("outlet_token");
      const res = await fetch(`http://localhost:8000/api/v1/outlet/orders/${order_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOrder(await res.json());
    };
    fetchDetails();
  }, [order_id]);

  if (!order) return <div className="p-10 text-center">Loading Summary...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-lg font-medium text-gray-600">Order Summary</h1>
        <div className="space-x-2">
          <button onClick={() => router.back()} className="bg-pink-600 text-white px-4 py-1.5 rounded text-sm">« Back</button>
          <button onClick={() => window.print()} className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm">⎙ Print</button>
        </div>
      </div>

      {/* Details Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h3 className="font-bold text-gray-800 mb-2">Order Details</h3>
          <div className="text-sm space-y-1 text-gray-600">
            <p><span className="font-medium">Order ID:</span> {order.order_number}</p>
            <p><span className="font-medium">Ordered On:</span> {new Date(order.created_at).toLocaleString()}</p>
            <p><span className="font-medium">Payment Mode:</span> <span className="uppercase">{order.payment_method}</span></p>
            <p><span className="font-medium">Order Status:</span> <span className="text-orange-500 font-bold">{order.order_status}</span></p>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 mb-2">Billing & Shipping Details</h3>
          <div className="text-sm space-y-1 text-gray-600">
            <p><span className="font-medium">Name:</span> {order.delivery_name}</p>
            <p><span className="font-medium">Phone:</span> {order.delivery_phone}</p>
            <p><span className="font-medium">Address:</span> {order.delivery_address_line1}, {order.delivery_city}, {order.delivery_state} - {order.delivery_zipcode}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-600">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Price</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Total Price</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item: any) => (
              <tr key={item.id} className="border-b">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded border"></div>
                  <span className="font-medium text-gray-700">{item.product?.name}</span>
                </td>
                <td className="p-4">₹ {item.price_per_unit.toFixed(2)}</td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4 font-bold text-gray-800">₹ {(item.price_per_unit * item.quantity).toFixed(2)}</td>
                <td className="p-4"><span className="text-orange-500 font-medium capitalize">{order.order_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Financial Summary */}
        <div className="p-4 bg-white space-y-2 border-t text-right flex flex-col items-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600"><span>Total</span> <span>₹ {order.total_amount.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span> <span>- ₹ 0.00</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery Charge</span> <span className="text-green-600">Free</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-800">
              <span>Payable Amount</span> <span>₹ {order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}