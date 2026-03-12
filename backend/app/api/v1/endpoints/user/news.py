from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import News

router = APIRouter()

@router.get("/")
def get_public_news(db: Session = Depends(get_db)):
    """
    Fetch all published news, ordered by newest first.
    """
    news_items = (
        db.query(News)
        .filter(News.status == True)
        .order_by(News.published_at.desc())
        .all()
    )
    
    return [
        {
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "feature_image": item.feature_image,
            "published_at": item.published_at,
            # Send a short preview of the content (first 120 chars)
            "excerpt": item.content[:120] + "..." if item.content and len(item.content) > 120 else item.content
        }
        for item in news_items
    ]

@router.get("/{slug}")
def get_news_detail(slug: str, db: Session = Depends(get_db)):
    """
    Fetch a single published news article by its slug.
    """
    news_item = (
        db.query(News)
        .filter(News.slug == slug, News.status == True)
        .first()
    )
    
    if not news_item:
        raise HTTPException(status_code=404, detail="News article not found")
        
    return {
        "id": news_item.id,
        "title": news_item.title,
        "slug": news_item.slug,
        "content": news_item.content,
        "feature_image": news_item.feature_image,
        "published_at": news_item.published_at
    }