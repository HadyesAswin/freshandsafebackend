import smtplib
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders
import os

def send_sales_report_email(file_paths):

    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = "etournament49@gmail.com" # The email sending the alert
    SENDER_PASSWORD = "ogtx onij tduj ckwb"     # App Password from Google
    ADMIN_EMAIL = "etournament49@gmail.com" 
    sender_email = "etournament49@gmail.com"
    sender_password = "ogtx onij tduj ckwb" 
    receiver_email = "etournament49@gmail.com"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = "Daily Outlet Sales Reports"

    body = "Attached are the outlet-wise daily sales reports."
    msg.attach(MIMEText(body, "plain"))

    # Attach all CSV files
    for file_path in file_paths:
        with open(file_path, "rb") as file:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file.read())

        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f"attachment; filename={os.path.basename(file_path)}",
        )

        msg.attach(part)

    # Send email
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, sender_password)
    server.send_message(msg)
    server.quit()