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
