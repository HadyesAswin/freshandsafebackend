import csv
import os
from datetime import datetime, timedelta
from collections import defaultdict
from app.models import Order, Outlet

def generate_outlet_csvs(db):
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)

    orders = db.query(Order).filter(
        Order.created_at >= today,
        Order.created_at < tomorrow
    ).all()

    # Group orders by outlet
    outlet_orders = defaultdict(list)

    for order in orders:
        outlet_name = "unknown"

        if hasattr(order, "outlet") and order.outlet:
            outlet_name = order.outlet.outlet_name
        elif hasattr(order, "outlet_id"):
            outlet = db.query(Outlet).filter(Outlet.id == order.outlet_id).first()
            outlet_name = outlet.outlet_name if outlet else "unknown"

        outlet_orders[outlet_name].append(order)

    file_paths = []

    # Create CSV per outlet
    for outlet_name, orders_list in outlet_orders.items():
        safe_name = outlet_name.lower().replace(" ", "_")
        file_path = f"/tmp/{safe_name}_sales_{today}.csv"

        with open(file_path, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)

            writer.writerow([
                "Order ID",
                "Outlet Name",
                "Customer",
                "Total Amount",
                "Order Status",
                "Payment Status",
                "Date"
            ])

            for order in orders_list:
                writer.writerow([
                        order.order_number,                      # better than id
                        getattr(order.outlet, "outlet_name", ""), 
                        order.customer_name,
                        order.total_amount,
                        order.order_status.value,                # ✅ FIXED
                        order.payment_status.value,              # ✅ BONUS
                        order.created_at
                    ])

        file_paths.append(file_path)

    return file_paths