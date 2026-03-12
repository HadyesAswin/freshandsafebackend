from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Blog

router = APIRouter()

@router.get("/")
def get_public_blogs(db: Session = Depends(get_db)):
    """Fetch all published blog posts, newest first."""
    blogs = (
        db.query(Blog)
        .filter(Blog.status == True)
        .order_by(Blog.published_at.desc())
        .all()
    )
    return blogs

@router.get("/{slug}")
def get_blog_detail(slug: str, db: Session = Depends(get_db)):
    """Fetch a single blog post by its unique slug."""
    blog = db.query(Blog).filter(Blog.slug == slug, Blog.status == True).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog