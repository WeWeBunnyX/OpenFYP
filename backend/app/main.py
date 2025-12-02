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

VALID_EMAIL = "test@example.com"
VALID_PASSWORD = "password"

@app.get("/")
def read_root():
    return {"message": "Backend is working!"}

@app.post("/login")
def login(data: dict, response: Response):
    email = data.get("email")
    password = data.get("password")

    if email == VALID_EMAIL and password == VALID_PASSWORD:
        return {"message": "Login successful"}
    response.status_code = status.HTTP_401_UNAUTHORIZED
    return {"message": "Invalid credentials"}
