from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.database import get_db
from app.models import ContactInfo

router = APIRouter()

# Schema for incoming form data
class ContactFormSubmit(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@router.get("/")
def get_public_contact_info(db: Session = Depends(get_db)):
    """
    Fetch all office/branch contact details managed by the admin.
    """
    contacts = db.query(ContactInfo).order_by(ContactInfo.id.asc()).all()
    
    return [
        {
            "id": c.id,
            "title": c.title,
            "email": c.email,
            "phone": c.phone,
            "description": c.description
        }
        for c in contacts
    ]

@router.post("/submit")
def submit_contact_form(data: ContactFormSubmit):
    """
    Receives contact form submission and sends an email to the admin.
    """
    # ⚠️ Replace these with your actual credentials
    sender_email = "etournament49@gmail.com" 
    sender_password = "ajrtpzthhebpcvum" 
    receiver_email = "etournament49@gmail.com" # Where you want to receive customer messages

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = f"New Contact Request: {data.subject}"
    
    # Construct the email body
    body = f"""
You have received a new message from the Fresh&Safe Contact Form:

Name: {data.name}
Email: {data.email}
Subject: {data.subject}

Message:
{data.message}
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        print(f"Failed to send contact form email: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to send message. Please try again later."
        )