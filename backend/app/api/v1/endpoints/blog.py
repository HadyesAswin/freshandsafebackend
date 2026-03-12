from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Blog
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "static/blogs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
def list_blogs(db: Session = Depends(get_db)):
    return db.query(Blog).order_by(Blog.created_at.desc()).all()

@router.post("/")
async def create_blog(
    title: str = Form(...),
    slug: str = Form(...),
    content: str = Form(...),
    author: str = Form("Fresh & Safe Team"),
    status: str = Form("true"),
    feature_image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_path = None
    if feature_image:
        image_path = f"/{UPLOAD_DIR}/{feature_image.filename}"
        with open(f"{UPLOAD_DIR}/{feature_image.filename}", "wb") as buffer:
            shutil.copyfileobj(feature_image.file, buffer)

    new_blog = Blog(
        title=title, slug=slug, content=content, 
        author=author, status=status.lower() == "true",
        feature_image=image_path
    )
    db.add(new_blog)
    db.commit()
    return {"message": "Blog created successfully"}

# ✅ FIXED: ADDED THE PUT METHOD TO HANDLE EDITS
@router.put("/{id}")
async def update_blog(
    id: int,
    title: str = Form(...),
    slug: str = Form(...),
    content: str = Form(...),
    author: str = Form(...),
    status: str = Form(...),
    feature_image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    blog.title = title
    blog.slug = slug
    blog.content = content
    blog.author = author
    blog.status = status.lower() == "true"

    if feature_image:
        image_path = f"/{UPLOAD_DIR}/{feature_image.filename}"
        with open(f"{UPLOAD_DIR}/{feature_image.filename}", "wb") as buffer:
            shutil.copyfileobj(feature_image.file, buffer)
        blog.feature_image = image_path

    db.commit()
    return {"message": "Blog updated successfully"}

@router.delete("/{id}")
def delete_blog(id: int, db: Session = Depends(get_db)):
    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog: raise HTTPException(404, "Not found")
    db.delete(blog)
    db.commit()
    return {"message": "Deleted"}