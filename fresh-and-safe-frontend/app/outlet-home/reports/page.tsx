"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TransactionsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  const limit = 10;

  const fetchTransactions = async () => {
    const token = localStorage.getItem("outlet_token");

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:8000/api/v1/outlet/orders?page=${page}&limit=${limit}&period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setHasNextPage(data.length === limit);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, period]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-700">
          Transactions
        </h1>

        <button className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800">
          📥 Export Excel
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6 flex gap-4 items-center">
        <span className="text-sm font-medium text-gray-600">
          Report Type:
        </span>

        <button
          onClick={() => {
            setPeriod("week");
            setPage(1);
          }}
          className={`px-4 py-2 rounded text-sm ${
            period === "week"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Weekly (Last 7 Days)
        </button>

        {/* <button
          onClick={() => {
            setPeriod("month");
            setPage(1);
          }}
          className={`px-4 py-2 rounded text-sm ${
            period === "month"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Monthly (Last 30 Days)
        </button> */}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-600 font-medium">
            <tr>
              <th className="p-4 w-12">#</th>
              <th className="p-4">Order ID</th>
              <th className="p-4">Email</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400">
                  Loading transactions...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order: any, index: number) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-gray-500">
                    {(page - 1) * limit + index + 1}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/outlet-home/orders/${order.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {order.order_number}
                    </Link>
                  </td>

                  <td className="p-4 text-gray-600">
                    {order.customer_email || "N/A"}
                  </td>

                  <td className="p-4 text-right font-semibold text-gray-800">
                    ₹ {order.total_amount?.toFixed(2)}
                  </td>

                  <td className="p-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between items-center p-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {page}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}