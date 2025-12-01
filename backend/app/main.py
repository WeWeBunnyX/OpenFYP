from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is working!"}

@app.post("/login")
def login(data: dict):
    email = data.get("email")
    password = data.get("password")
    # For testing, just return the values
    return {"email": email, "password": password}
