import requests
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models import Outlet

def get_lat_lng_from_zipcode(zipcode: str):
    print(f"🌍 [MAP SERVICE] Fetching coordinates for Zipcode: '{zipcode}' via Nominatim API...")
    url = "https://nominatim.openstreetmap.org/search"
    params = {"postalcode": zipcode, "country": "India", "format": "json"}
    headers = {"User-Agent": "fresh-and-safe-app"}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200 and response.json():
            data = response.json()
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            print(f"📍 [MAP SERVICE] Success! Zipcode '{zipcode}' resolved to Lat: {lat}, Lng: {lon}")
            return lat, lon
        else:
            print(f"❌ [MAP SERVICE] API returned status {response.status_code} or empty data for Zipcode '{zipcode}'")
    except Exception as e:
        print(f"⚠️ [MAP SERVICE] API Exception for Zipcode '{zipcode}': {e}")
        pass
    
    return None, None

def get_nearby_outlets(db: Session, user_lat: float, user_lng: float, radius_km: int = 15):
    # ✅ We use a clamp to ensure the value inside acos is between -1 and 1
    # This prevents the query from failing on exact coordinate matches.
    cos_lat_user = func.cos(func.radians(user_lat))
    sin_lat_user = func.sin(func.radians(user_lat))

    distance_formula = (
        6371 * func.acos(
            case(
                (
                    (cos_lat_user * func.cos(func.radians(Outlet.latitude)) * func.cos(func.radians(Outlet.longitude) - func.radians(user_lng)) + 
                     sin_lat_user * func.sin(func.radians(Outlet.latitude))) > 1, 1
                ),
                (
                    (cos_lat_user * func.cos(func.radians(Outlet.latitude)) * func.cos(func.radians(Outlet.longitude) - func.radians(user_lng)) + 
                     sin_lat_user * func.sin(func.radians(Outlet.latitude))) < -1, -1
                ),
                else_=(cos_lat_user * func.cos(func.radians(Outlet.latitude)) * func.cos(func.radians(Outlet.longitude) - func.radians(user_lng)) + 
                       sin_lat_user * func.sin(func.radians(Outlet.latitude)))
            )
        )
    )

    return db.query(Outlet).filter(
        Outlet.status == True,
        Outlet.is_deleted == False, # ✅ Safety check
        Outlet.latitude.isnot(None),
        Outlet.longitude.isnot(None),
        distance_formula <= radius_km
    ).all()