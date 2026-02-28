"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  Download, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Banknote
} from "lucide-react";

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-600" />
            Transactions
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your outlet's revenue and order history.</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]">
          <Download className="w-4 h-4 text-gray-400" />
          Export Excel
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200 w-max">
        <div className="flex items-center gap-2 px-3 text-sm font-medium text-gray-500 border-r border-gray-200 mr-1">
          <CalendarDays className="w-4 h-4" /> 
          Report Type
        </div>

        <button
          onClick={() => {
            setPeriod("week");
            setPage(1);
          }}
          className={`px-4 py-1.5 rounded-md text-sm transition-all ${
            period === "week"
              ? "bg-red-50 text-red-700 font-semibold shadow-sm border border-red-100"
              : "text-gray-600 hover:bg-gray-50 font-medium border border-transparent"
          }`}
        >
          Weekly (Last 7 Days)
        </button>

        {/* <button
          onClick={() => {
            setPeriod("month");
            setPage(1);
          }}
          className={`px-4 py-1.5 rounded-md text-sm transition-all ${
            period === "month"
              ? "bg-red-50 text-red-700 font-semibold shadow-sm border border-red-100"
              : "text-gray-600 hover:bg-gray-50 font-medium border border-transparent"
          }`}
        >
          Monthly (Last 30 Days)
        </button> 
        */}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-16">#</th>
                <th scope="col" className="px-6 py-4 font-medium">Order ID</th>
                <th scope="col" className="px-6 py-4 font-medium">Customer Email</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Loading transactions...</p>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order: any, index: number) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group align-middle">
                    <td className="px-6 py-4 text-gray-400 font-medium">
                      {(page - 1) * limit + index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/outlet-home/orders/${order.id}`}
                        className="font-bold text-gray-900 tracking-tight hover:text-red-600 transition-colors"
                      >
                        #{order.order_number}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {order.customer_email || <span className="text-gray-400 italic">N/A</span>}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1 font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                        ₹ {order.total_amount?.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Banknote className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No transactions found for this period.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm font-medium text-gray-500">
            Page {page}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}