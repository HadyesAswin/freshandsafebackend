import requests
from app.core.config import settings
from app.models import Order, Outlet

class QwqerService:
    def __init__(self):
        self.base_url = settings.QWQER_API_URL
        self.headers = {
            "ClientSecret": settings.QWQER_CLIENT_SECRET,
            "Content-Type": "application/json"
        }

    def calculate_price(self, outlet: Outlet, order: Order, weight: float = 1.0):
        base = self.base_url.rstrip("/")
        url = f"{base}/client/price-calculate/"
        
        payload = {
            "from_latitude": float(outlet.latitude or 9.9312),
            "from_longitude": float(outlet.longitude or 76.2673),
            "from_pincode": outlet.zipcode,
            "to_latitude": float(order.delivery_latitude or 10.0246),
            "to_longitude": float(order.delivery_longitude or 76.3075),
            "to_pincode": order.delivery_zipcode,
            "weight": float(weight),
            "payment_mode": 6, 
            "merchant_order_amount": 0.0
        }

        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            return response.json().get("data", {})
        return {"error": response.text}

    def create_delivery_order(self, outlet: Outlet, order: Order, weight: float = 1.0, item_type: int = 3):
        base = self.base_url.rstrip("/")
        url = f"{base}/client/order/"
        
        f_phone = "".join(filter(str.isdigit, outlet.phone))[-10:] if outlet.phone else "9876543210"
        t_phone = "".join(filter(str.isdigit, order.delivery_phone))[-10:] if order.delivery_phone else "9876543210"

        payload = {
            "description": f"Fresh and Safe Order {order.order_number}"[:100],
            "from_name": outlet.outlet_name,
            "from_phone": f"+91{f_phone}",
            "from_address": outlet.address,
            "from_locality": outlet.city,
            "from_pincode": outlet.zipcode,
            "from_house_number": outlet.landmark or "Store 1",
            "from_latitude": float(outlet.latitude or 9.9312),
            "from_longitude": float(outlet.longitude or 76.2673),
            "to_name": order.delivery_name,
            "to_phone": f"+91{t_phone}",
            "to_address": order.delivery_address_line1,
            "to_house_number": order.delivery_house_number or "NA",
            "to_locality": order.delivery_city,
            "to_pincode": order.delivery_zipcode,
            "to_latitude": float(order.delivery_latitude or 10.0246),
            "to_longitude": float(order.delivery_longitude or 76.3075),
            "merchant_order_id": order.order_number,
            "store_order_id": order.order_number,
            "weight": float(weight),
            "payment_mode": 6, 
            "item_type": item_type,
            "merchant_order_amount": 0.0
        }

        response = requests.post(url, json=payload, headers=self.headers)
        try:
            return response.json()
        except Exception:
            return {"error": "Invalid JSON response", "raw": response.text}

    def track_order(self, order_key: str):
        url = f"{self.base_url.rstrip('/')}/client/order/details/{order_key}"
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                try:
                    return response.json()
                except ValueError:
                    return {"message": "Error", "detail": "Empty JSON response"}
            return {"message": "Error", "status_code": response.status_code}
        except Exception as e:
            return {"message": "Error", "detail": str(e)}

    def cancel_order(self, qwqer_order_id: str, reason_code: int = 1, comments: str = "Cancelled by Admin"):
        base = self.base_url.rstrip("/")
        url = f"{base}/client/order/cancel/"
        payload = {
            "order_key": qwqer_order_id,
            "reason": reason_code,
            "comment": comments
        }
        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()