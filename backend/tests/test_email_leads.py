"""
Test lead email notification feature:
- POST /api/leads triggers async send_lead_notification, does not block
- email_notified flag set on lead within a few seconds
- Uses delivered@resend.dev (Resend test inbox) for verified delivery
- Regression: marketplace still returns 3 published demo vendors
"""
import os
import time
import uuid
import subprocess
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://iridescent-weddings.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@wedora.ai", "password": "WedoraAdmin@2026"}
PETAL = {"email": "petal@demo.wedora.ai", "password": "VendorDemo@2026"}


def login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def auth_h(tok):
    return {"Authorization": f"Bearer {tok}"}


# --- Lead → email flow with real Resend test inbox ---
class TestEmailLead:
    def test_register_vendor_send_lead_verify_email(self):
        suffix = uuid.uuid4().hex[:8]
        email = "delivered@resend.dev"
        payload = {
            "business_name": f"TEST Email Studio {suffix}",
            "contact_person": "Email Tester",
            "phone": "9999900000",
            "whatsapp": "9999900000",
            "email": email.replace("@", f"+{suffix}@"),  # unique per run, still routed by resend test inbox
            "password": "TestPass@2026",
            "category": "Photographer",
            "city": "Delhi",
            "years_experience": 3,
            "starting_price": 40000,
        }
        r = requests.post(f"{API}/vendor/register", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        vendor_id = data["vendor"]["id"]
        slug = data["vendor"]["slug"]

        # send lead & measure latency
        t0 = time.time()
        lead_payload = {
            "vendor_slug": slug, "name": "TEST Couple", "email": "couple@test.com",
            "phone": "9111111111", "wedding_date": "2026-11-11", "city": "Jaipur",
            "guest_count": 200, "budget": "10-15L", "functions": "Sangeet, Wedding",
            "required_service": "Candid photography", "theme": "Pastel", "message": "please share portfolio",
        }
        r = requests.post(f"{API}/leads", json=lead_payload, timeout=30)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        lead_id = body["lead_id"]
        # must return fast — email is fire-and-forget
        assert elapsed < 2.0, f"POST /api/leads took {elapsed:.2f}s (must be <2s, fire-and-forget)"

        # wait up to 15s for background task to complete
        admin_tok = login(**ADMIN)
        email_notified = False
        for _ in range(15):
            time.sleep(1)
            r = requests.get(f"{API}/admin/leads", headers=auth_h(admin_tok), timeout=30)
            if r.status_code == 200:
                lead = next((l for l in r.json()["leads"] if l["id"] == lead_id), None)
                if lead and lead.get("email_notified") is True:
                    email_notified = True
                    break
        assert email_notified, f"email_notified flag was not set on lead {lead_id} within 15s"

        # check backend log for 'Email sent to <email>: id=...'
        try:
            log = subprocess.check_output(
                ["tail", "-n", "500", "/var/log/supervisor/backend.err.log"],
                stderr=subprocess.STDOUT, timeout=10,
            ).decode("utf-8", errors="ignore")
        except Exception:
            log = ""
        needle = f"Email sent to {payload['email']}"
        assert needle in log, f"backend log missing '{needle}'. last log chunk:\n{log[-1500:]}"

        # cleanup: unpublish this test vendor to keep marketplace clean
        r = requests.patch(
            f"{API}/admin/vendors/{vendor_id}",
            headers=auth_h(admin_tok),
            json={"is_published": False},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        # verify unpublished via marketplace list (vendor_public omits is_published)
        r = requests.get(f"{API}/marketplace/vendors", timeout=30)
        slugs = {v["slug"] for v in r.json()["vendors"]}
        assert slug not in slugs, f"test vendor {slug} still published after unpublish"


# --- Fast-path: POST /api/leads on existing petal vendor is fast ---
class TestLeadNonBlocking:
    def test_petal_lead_returns_fast_and_marks_notified(self):
        petal_tok = login(**PETAL)
        me = requests.get(f"{API}/vendor/me", headers=auth_h(petal_tok), timeout=30).json()
        slug = me["vendor"]["slug"]

        t0 = time.time()
        r = requests.post(f"{API}/leads", json={
            "vendor_slug": slug, "name": "TEST FastPath", "email": "fp@test.com",
            "phone": "9222222222", "city": "Jaipur", "guest_count": 150, "message": "quick check",
        }, timeout=30)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        assert elapsed < 2.0, f"POST /api/leads took {elapsed:.2f}s"
        lead_id = r.json()["lead_id"]

        # wait for background task
        notified = False
        for _ in range(10):
            time.sleep(1)
            r = requests.get(f"{API}/vendor/leads", headers=auth_h(petal_tok), timeout=30)
            lead = next((l for l in r.json()["leads"] if l["id"] == lead_id), None)
            if lead and lead.get("email_notified") is True:
                notified = True
                break
        assert notified, f"petal lead {lead_id} email_notified not set in 10s"


# --- Regression: marketplace list & profile ---
class TestMarketplaceRegression:
    def test_marketplace_has_three_published(self):
        r = requests.get(f"{API}/marketplace/vendors", timeout=30)
        assert r.status_code == 200
        vendors = r.json()["vendors"]
        # spec: 3 published demo vendors
        assert len(vendors) >= 3, f"expected >=3 published, got {len(vendors)}"
        slugs = {v["slug"] for v in vendors}
        assert "petal-pearl-studio" in slugs

    def test_chat_stream_endpoint_ok(self):
        # non-stream chat used as smoke test (stream endpoint uses SSE)
        r = requests.post(f"{API}/chat", json={"message": "hi", "session_id": f"regress-{uuid.uuid4().hex[:6]}"}, timeout=90)
        assert r.status_code == 200
