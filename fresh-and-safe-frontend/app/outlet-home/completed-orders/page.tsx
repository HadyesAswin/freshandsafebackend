"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle, 
  RefreshCw, 
  Loader2, 
  PackageCheck, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";

export default function CompletedOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const limit = 10;

  const fetchCompletedOrders = async () => {
    const token = localStorage.getItem("outlet_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:8000/api/v1/outlet/orders?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();

        // ✅ FILTER ONLY DELIVERED
        const deliveredOrders = data
          .filter(
            (o: any) =>
              (o.order_status || o.status)?.toLowerCase() === "delivered"
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

        setOrders(deliveredOrders);

        // If backend returns less than limit, no next page
        setHasNextPage(data.length === limit);
      }
    } catch (err) {
      console.error("Failed to fetch completed orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, [page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-red-600" />
            Completed Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review all successfully delivered customer orders.</p>
        </div>

        <button
          onClick={() => fetchCompletedOrders()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : 'text-gray-400'}`} />
          Refresh List
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Order #</th>
                <th scope="col" className="px-6 py-4 font-medium">Items</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Loading completed orders...</p>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors group align-middle"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 tracking-tight">
                        #{order.order_number}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <div className="text-sm text-gray-600 truncate">
                        {order.order_items
                          ?.map(
                            (i: any) =>
                              `${i.product?.name || "Product"} (x${i.quantity})`
                          )
                          .join(", ")}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-green-50 text-green-700 border-green-200">
                        Delivered
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/outlet-home/orders/${order.id}`}
                          className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center"
                  >
                    <PackageCheck className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No completed orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ PAGINATION */}
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