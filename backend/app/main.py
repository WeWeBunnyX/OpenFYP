from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USERS = {
    "test@example.com": {"password": "password", "role": "Student", "name": "Test Student"},
    "supervisor@example.com": {"password": "password", "role": "Supervisor", "name": "Dr. Supervisor"},
    "coordinator@example.com": {"password": "password", "role": "Coordinator", "name": "Coordinator"},
}

# Simple in-memory registration store for demo purposes.
REGISTRATIONS = []
REG_ID_SEQ = 1

def get_user_from_header(email_header: str):
    if not email_header:
        return None
    return USERS.get(email_header)

# Simple in-memory notifications: map user email -> list of notifications
NOTIFICATIONS = {}

def push_notification(email: str, message: str):
    if not email:
        return
    NOTIFICATIONS.setdefault(email, []).append({"message": message})

@app.get("/")
def read_root():
    return {"message": "Backend is working!"}

@app.post("/login")
def login(data: dict, response: Response):
    email = data.get("email")
    password = data.get("password")

    user = USERS.get(email)
    if user and user.get("password") == password:
        return {
            "message": "Login successful",
            "user": {"email": email, "name": user.get("name"), "role": user.get("role")},
        }

    response.status_code = status.HTTP_401_UNAUTHORIZED
    return {"message": "Invalid credentials"}


@app.post("/registrations")
def create_registration(data: dict, response: Response, x_user_email: str = None):
    """Student submits a registration. Expects header X-User-Email to identify user."""
    user = get_user_from_header(x_user_email)
    if not user or user.get("role") != "Student":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only students can submit registrations"}

    # validate supervisor exists
    supervisor_email = data.get("supervisor")
    if supervisor_email not in USERS:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"message": "Supervisor not found"}

    global REG_ID_SEQ
    reg = {
        "id": REG_ID_SEQ,
        "owner": x_user_email,
        "title": data.get("title"),
        "supervisor": supervisor_email,
        "abstract": data.get("abstract"),
        # initial status requires supervisor approval
        "status": "pending_approval",
        "history": [],
    }
    REG_ID_SEQ += 1
    REGISTRATIONS.append(reg)
    # log history
    reg["history"].append({"actor": x_user_email, "action": "submitted", "note": "Student submitted registration"})

    # push notification to supervisor and coordinator
    push_notification(supervisor_email, f"New registration submitted by {x_user_email}: {reg['title']}")
    # notify coordinators (all users with Coordinator role)
    for email, u in USERS.items():
        if u.get("role") == "Coordinator":
            push_notification(email, f"Registration submitted by {x_user_email}: {reg['title']}")
    return {"message": "Submitted", "registration": reg}


@app.get("/registrations")
def list_registrations(x_user_email: str = None):
    """List registrations. If requester is supervisor, return submitted ones. If coordinator, return all. If student, return own."""
    user = get_user_from_header(x_user_email)
    if not user:
        return {"registrations": []}

    role = user.get("role")
    if role == "Supervisor":
        # supervisors see pending_approval items assigned to them
        return {"registrations": [r for r in REGISTRATIONS if r.get("status") == "pending_approval" and r.get("supervisor") == x_user_email]}
    if role == "Coordinator":
        return {"registrations": REGISTRATIONS}
    if role == "Student":
        return {"registrations": [r for r in REGISTRATIONS if r.get("owner") == x_user_email]}

    return {"registrations": []}


@app.get("/notifications")
def get_notifications(x_user_email: str = None):
    if not x_user_email:
        return {"notifications": []}
    return {"notifications": NOTIFICATIONS.get(x_user_email, [])}


@app.patch("/registrations/{reg_id}/approve")
def approve_registration(reg_id: int, response: Response, x_user_email: str = None):
    user = get_user_from_header(x_user_email)
    if not user or user.get("role") != "Supervisor":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only supervisors can approve"}

    for r in REGISTRATIONS:
        if r["id"] == reg_id:
            r["status"] = "approved"
            r.setdefault("history", []).append({"actor": x_user_email, "action": "approved", "note": "Supervisor approved"})
            # notify student and coordinator
            push_notification(r.get("owner"), f"Your registration '{r.get('title')}' was approved by {x_user_email}")
            for email, u in USERS.items():
                if u.get("role") == "Coordinator":
                    push_notification(email, f"Registration '{r.get('title')}' approved by supervisor {x_user_email}")
            return {"message": "Approved", "registration": r}

    response.status_code = status.HTTP_404_NOT_FOUND
    return {"message": "Not found"}


@app.patch("/registrations/{reg_id}/reject")
def reject_registration(reg_id: int, response: Response, x_user_email: str = None):
    user = get_user_from_header(x_user_email)
    if not user or user.get("role") != "Supervisor":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only supervisors can reject"}

    for r in REGISTRATIONS:
        if r["id"] == reg_id:
            r["status"] = "rejected"
            r.setdefault("history", []).append({"actor": x_user_email, "action": "rejected", "note": "Supervisor rejected"})
            # notify student
            push_notification(r.get("owner"), f"Your registration '{r.get('title')}' was rejected by {x_user_email}")
            return {"message": "Rejected", "registration": r}

    response.status_code = status.HTTP_404_NOT_FOUND
    return {"message": "Not found"}


@app.patch("/registrations/{reg_id}/verify")
def verify_registration(reg_id: int, response: Response, x_user_email: str = None):
    user = get_user_from_header(x_user_email)
    if not user or user.get("role") != "Coordinator":
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"message": "Only coordinators can verify"}

    for r in REGISTRATIONS:
        if r["id"] == reg_id:
            r["status"] = "registered"
            r.setdefault("history", []).append({"actor": x_user_email, "action": "verified", "note": "Coordinator verified (registered)"})
            # notify student
            push_notification(r.get("owner"), f"Your registration '{r.get('title')}' was verified by coordinator {x_user_email}")
            return {"message": "Verified", "registration": r}

    response.status_code = status.HTTP_404_NOT_FOUND
    return {"message": "Not found"}
