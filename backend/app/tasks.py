from app.core.celery_app import celery_app
import time

# --- YOUR EXISTING TASK ---
@celery_app.task(name="test_email_task")
def test_email_task(email_address: str):
    # This simulates a slow process (like sending an email)
    print(f"📧 [EMAIL TASK] STARTING to send email to {email_address}...")
    time.sleep(5)  # Sleep for 5 seconds to simulate work
    print(f"✅ [EMAIL TASK] FINISHED sending email to {email_address}!")
    return "Email Sent"

# --- NEW TASK FOR CATEGORY ALERTS ---
@celery_app.task(name="notify_admin_event")
def notify_admin_event(event_type: str, message: str):
    """
    Used by Categories CRUD to log changes in the background.
    """
    print(f"🔔 [ADMIN ALERT] Processing event: {event_type}")
    time.sleep(1) # Simulate connecting to a notification service
    print(f"✅ [ADMIN ALERT] Notification sent: {message}")
    return f"Processed {event_type}"