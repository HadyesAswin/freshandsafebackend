"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Completed Orders
        </h1>

        <button
          onClick={() => fetchCompletedOrders()}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh List
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">
                  Order #
                </th>
                <th className="p-4 font-semibold text-gray-600">
                  Items
                </th>
                <th className="p-4 font-semibold text-gray-600">
                  Status
                </th>
                <th className="p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-4 font-bold text-green-700">
                      {order.order_number}
                    </td>

                    <td className="p-4 text-sm text-gray-600">
                      {order.order_items
                        ?.map(
                          (i: any) =>
                            `${i.product?.name || "Product"} (x${i.quantity})`
                        )
                        .join(", ")}
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-1 text-xs rounded-full uppercase font-medium bg-green-100 text-green-700">
                        Delivered
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/outlet-home/orders/${order.id}`}
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center text-gray-500"
                  >
                    No completed orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ PAGINATION */}
        <div className="flex justify-between items-center p-4 border-t">
          <button
            onClick={() =>
              setPage((p) => Math.max(p - 1, 1))
            }
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