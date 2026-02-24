"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OutForDeliveryPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const limit = 10;

  const fetchOrders = async () => {
    const token = localStorage.getItem("outlet_token");

    if (!token) {
      router.push("/shop-login");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:8000/api/v1/outlet/orders/out-for-delivery?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();

        setOrders(data);

        // If we got less than limit, no more pages
        setHasNextPage(data.length === limit);
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Failed to fetch delivery orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Out For Delivery Orders
        </h1>

        <button
          onClick={() => fetchOrders()}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh List
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Order #</th>
              <th className="p-4">Items</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center">
                  Loading...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order: any) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold text-purple-700">
                    {order.order_number}
                  </td>

                  <td className="p-4 text-sm text-gray-600">
                    {order.order_items
                      ?.map(
                        (i: any) =>
                          `${i.product?.name} (x${i.quantity})`
                      )
                      .join(", ")}
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full uppercase font-medium bg-purple-100 text-purple-700">
                      Out For Delivery
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
                  No delivery orders.
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