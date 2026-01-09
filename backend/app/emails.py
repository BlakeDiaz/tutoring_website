import resend
from .config import config

resend.api_key = config["credentials.email"]["api_key"]


def send_book_appointment_confirmation_email(email_address: str, name: str, appointment_date: str, appointment_time: str):
    try:
        resend.Emails.send({
            "from": "noreply <noreply@tutoring.existingeevee.org>",
            "to": email_address,
            "template": {
                "id": "booking-confirmation",
                "variables": {
                    "NAME": name,
                    "APPOINTMENT_DATE": appointment_date,
                    "APPOINTMENT_TIME": appointment_time
                }
            }
        })
    except Exception as e:
        print(e)

def send_cancel_appointment_confirmation_email(email_address: str, name: str, appointment_date: str, appointment_time: str):
    try:
        resend.Emails.send({
            "from": "noreply <noreply@tutoring.existingeevee.org>",
            "to": email_address,
            "template": {
                "id": "cancellation-confirmation",
                "variables": {
                    "NAME": name,
                    "APPOINTMENT_DATE": appointment_date,
                    "APPOINTMENT_TIME": appointment_time
                }
            }
        })
    except Exception as e:
        print(e)
