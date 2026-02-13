import requests
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Outlet


# Convert zipcode → latitude/longitude using OpenStreetMap
def get_lat_lng_from_zipcode(zipcode: str):

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "postalcode": zipcode,
        "country": "India",
        "format": "json"
    }

    headers = {
        "User-Agent": "fresh-and-safe-app"
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code != 200:
        return None, None

    data = response.json()

    if not data:
        return None, None

    return float(data[0]["lat"]), float(data[0]["lon"])


# Find outlets within 15km
def get_nearby_outlets(db: Session, user_lat: float, user_lng: float, radius_km: int = 15):

    return db.query(Outlet).filter(
        Outlet.status == True,
        Outlet.latitude.isnot(None),
        Outlet.longitude.isnot(None),
        (
            6371 * func.acos(
                func.cos(func.radians(user_lat)) *
                func.cos(func.radians(Outlet.latitude)) *
                func.cos(func.radians(Outlet.longitude) - func.radians(user_lng)) +
                func.sin(func.radians(user_lat)) *
                func.sin(func.radians(Outlet.latitude))
            )
        ) <= radius_km
    ).all()
