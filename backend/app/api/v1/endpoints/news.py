import json
import shutil
import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.models import News as NewsModel
from app.models import User
# ✅ These will now "shine" because we use them in response_model
from app.schemas.news import News, NewsCreate 
from app.tasks import notify_admin_event

router = APIRouter()

# --- HELPER: SAVE IMAGE ---
def save_upload_file(upload_file: UploadFile) -> str:
    upload_dir = "static/uploads/news"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True) # Added exist_ok
    file_path = os.path.join(upload_dir, upload_file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return f"/static/uploads/news/{upload_file.filename}"

# --- HELPER: CLEAR CACHE ---
def clear_news_cache():
    try:
        r = get_redis_client()
        keys = list(r.scan_iter("news:*"))
        if keys: r.delete(*keys)
    except: pass

# 1. GET ALL NEWS
@router.get("/", response_model=List[News]) # ✅ Used News here
def read_news(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    cache_key = f"news:{skip}:{limit}"
    redis = get_redis_client()
    
    try:
        cached = redis.get(cache_key)
        if cached: return json.loads(cached)
    except: pass

    news_list = db.query(NewsModel).offset(skip).limit(limit).all()
    
    try:
        redis.setex(cache_key, 600, json.dumps(jsonable_encoder(news_list)))
    except: pass
    
    return news_list

# 2. CREATE NEWS
@router.post("/", response_model=News) # ✅ Used News here
def create_news(
    title: str = Form(...),
    slug: str = Form(...),
    content: str = Form(...),
    status: bool = Form(True),
    published_at: Optional[str] = Form(None),
    feature_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    if db.query(NewsModel).filter(NewsModel.slug == slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    image_url = save_upload_file(feature_image) if feature_image else None
    
    pub_date = datetime.now()
    if published_at:
        try:
            pub_date = datetime.fromisoformat(published_at)
        except:
            pass

    news_item = NewsModel(
        title=title,
        slug=slug,
        content=content,
        feature_image=image_url,
        status=status,
        published_at=pub_date
    )
    
    db.add(news_item)
    db.commit()
    db.refresh(news_item)
    
    clear_news_cache()
    notify_admin_event.delay("CREATE_NEWS", f"News Published: {title}")
    return news_item

# 3. UPDATE NEWS
@router.put("/{news_id}", response_model=News) # ✅ Used News here
def update_news(
    news_id: int,
    title: str = Form(...),
    slug: str = Form(...),
    content: str = Form(...),
    status: bool = Form(True),
    published_at: Optional[str] = Form(None),
    feature_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_admin),
):
    news_item = db.query(NewsModel).filter(NewsModel.id == news_id).first()
    if not news_item: raise HTTPException(status_code=404, detail="News not found")

    news_item.title = title
    news_item.slug = slug
    news_item.content = content
    news_item.status = status
    
    if published_at:
        try: news_item.published_at = datetime.fromisoformat(published_at)
        except: pass

    if feature_image:
        news_item.feature_image = save_upload_file(feature_image)

    db.add(news_item)
    db.commit()
    db.refresh(news_item) # Added refresh
    clear_news_cache()
    notify_admin_event.delay("UPDATE_NEWS", f"News Updated: {title}")
    return news_item

# 4. DELETE NEWS
@router.delete("/{news_id}")
def delete_news(news_id: int, db: Session = Depends(get_db), current_user: User = Depends(deps.get_current_active_admin)):
    news_item = db.query(NewsModel).filter(NewsModel.id == news_id).first()
    if not news_item: raise HTTPException(status_code=404, detail="News not found")
    
    db.delete(news_item)
    db.commit()
    clear_news_cache()
    return {"ok": True}