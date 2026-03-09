import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from io import BytesIO
from datetime import datetime
from core.config import settings

# --- Certificate generation ---
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def _smtp_connection():
    """Creates and returns an authenticated SMTP connection."""
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
    return server


def _send_html_email(to_email: str, subject: str, html_body: str, attachments: list[tuple[str, bytes, str]] | None = None):
    """
    Sends an HTML email. attachments is a list of (filename, data_bytes, mime_subtype).
    """
    msg = MIMEMultipart("mixed")
    msg["From"] = settings.SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    if attachments:
        for filename, data, subtype in attachments:
            img_part = MIMEImage(data, _subtype=subtype)
            img_part.add_header("Content-Disposition", "attachment", filename=filename)
            msg.attach(img_part)

    with _smtp_connection() as server:
        server.send_message(msg)


# ──────────────────────────────────────────────
# 1. Enrollment confirmation
# ──────────────────────────────────────────────
def send_enrollment_email(to_email: str, learner_name: str, course_title: str):
    subject = f"You're enrolled in {course_title}!"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#4F46E5;">Welcome aboard, {learner_name}! 🎉</h2>
        <p>You have been successfully enrolled in <strong>{course_title}</strong>.</p>
        <p>Head over to your dashboard to start learning right away.</p>
        <br>
        <p style="color:#6b7280;font-size:12px;">— LTC Learn</p>
    </div>
    """
    _send_html_email(to_email, subject, html)


# ──────────────────────────────────────────────
# 2. Course completion + certificate
# ──────────────────────────────────────────────
def _generate_certificate_image(learner_name: str, course_title: str, completion_date: str, instructor_name: str) -> bytes:
    """Generates a certificate PNG and returns the raw bytes."""
    cert_id = f"LTC-{uuid.uuid4().hex[:8].upper()}"
    W, H = 1200, 850
    img = Image.new("RGB", (W, H), "#ffffff")
    draw = ImageDraw.Draw(img)

    # Border
    draw.rectangle([20, 20, W - 20, H - 20], outline="#4F46E5", width=4)
    draw.rectangle([30, 30, W - 30, H - 30], outline="#818CF8", width=2)

    # Try to load a nicer font, fall back to default
    try:
        title_font = ImageFont.truetype("arial.ttf", 42)
        name_font = ImageFont.truetype("arialbd.ttf", 52)
        body_font = ImageFont.truetype("arial.ttf", 28)
        small_font = ImageFont.truetype("arial.ttf", 20)
        id_font = ImageFont.truetype("arial.ttf", 16)
    except OSError:
        title_font = ImageFont.load_default()
        name_font = title_font
        body_font = title_font
        small_font = title_font
        id_font = title_font

    # Platform name
    draw.text((W // 2, 55), "LTC Learn", fill="#818CF8", font=body_font, anchor="mm")

    # Header
    draw.text((W // 2, 105), "CERTIFICATE OF COMPLETION", fill="#4F46E5", font=title_font, anchor="mm")
    draw.line([(200, 140), (W - 200, 140)], fill="#818CF8", width=2)

    # Body
    draw.text((W // 2, 210), "This is to certify that", fill="#374151", font=body_font, anchor="mm")
    draw.text((W // 2, 280), learner_name, fill="#111827", font=name_font, anchor="mm")
    draw.text((W // 2, 360), "has successfully completed the course", fill="#374151", font=body_font, anchor="mm")
    draw.text((W // 2, 430), course_title, fill="#4F46E5", font=name_font, anchor="mm")
    draw.text((W // 2, 520), f"Date of Completion: {completion_date}", fill="#6B7280", font=body_font, anchor="mm")

    # Footer — Instructor signature (left third, centered)
    draw.line([(250, 670), (550, 670)], fill="#374151", width=1)
    draw.text((400, 688), instructor_name, fill="#374151", font=small_font, anchor="mm")
    draw.text((400, 712), "Instructor", fill="#6B7280", font=small_font, anchor="mm")

    # Footer — Managing Director (right third, centered)
    draw.line([(650, 670), (950, 670)], fill="#374151", width=1)
    draw.text((800, 688), "Sherwin Vaz", fill="#374151", font=small_font, anchor="mm")
    draw.text((800, 712), "Managing Director, LTC Learn", fill="#6B7280", font=small_font, anchor="mm")

    # Certificate ID
    draw.text((W // 2, 780), f"Certificate ID: {cert_id}", fill="#9CA3AF", font=id_font, anchor="mm")

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def send_completion_email(to_email: str, learner_name: str, course_title: str, instructor_name: str = "Instructor"):
    completion_date = datetime.utcnow().strftime("%B %d, %Y")
    subject = f"Congratulations! You completed {course_title} 🎓"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#4F46E5;">Congratulations, {learner_name}! 🎉🎓</h2>
        <p>You have successfully completed <strong>{course_title}</strong>.</p>
        <p>Your certificate of completion is attached to this email.</p>
        <p>Keep up the great work and continue your learning journey!</p>
        <br>
        <p style="color:#6b7280;font-size:12px;">— LTC Learn</p>
    </div>
    """

    attachments = []
    if PIL_AVAILABLE:
        cert_bytes = _generate_certificate_image(learner_name, course_title, completion_date, instructor_name)
        attachments.append(("Certificate.png", cert_bytes, "png"))

    _send_html_email(to_email, subject, html, attachments)


# ──────────────────────────────────────────────
# 3. Trainer update to enrolled learners
# ──────────────────────────────────────────────
def send_trainer_update_email(to_email: str, learner_name: str, course_title: str, instructor_name: str, update_subject: str, update_message: str):
    subject = f"[{course_title}] {update_subject}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#4F46E5;">Course Update — {course_title}</h2>
        <p>Hi {learner_name},</p>
        <p>Your instructor <strong>{instructor_name}</strong> has shared an update for <strong>{course_title}</strong>:</p>
        <div style="background:#F3F4F6;padding:16px;border-radius:6px;margin:12px 0;">
            <strong>{update_subject}</strong>
            <p style="white-space:pre-wrap;">{update_message}</p>
        </div>
        <br>
        <p style="color:#6b7280;font-size:12px;">— LTC Learn</p>
    </div>
    """
    _send_html_email(to_email, subject, html)
