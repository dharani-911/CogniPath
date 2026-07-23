from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import DATABASE_FILE, engine, ensure_database_schema, SessionLocal
from models import Base, User
from schemas import ForgotPasswordRequest, UserCreate, UserLogin, UserOut

from fastapi.middleware.cors import CORSMiddleware


# Create database tables
Base.metadata.create_all(bind=engine)
ensure_database_schema()


app = FastAPI(title="CogniPath API")


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# Home API
@app.get("/")
def home():
    return {
        "message": "Backend Running Successfully",
        "database": str(DATABASE_FILE)
    }


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "security_question": user.security_question,
        "remember_me": user.remember_me,
        "status": "Active",
    }


def register_user(payload: UserCreate, db: Session) -> dict:
    email = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = User(
        name=payload.name.strip(),
        email=email,
        password=payload.password,
        security_question=payload.security_question.strip(),
        security_answer=payload.security_answer.lower().strip(),
        remember_me=payload.remember_me
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Registration Successful",
        "user": serialize_user(user)
    }


def login_user(payload: UserLogin, db: Session) -> dict:
    user = db.query(User).filter(
        User.email == payload.email.lower().strip(),
        User.password == payload.password
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    return {
        "success": True,
        "message": "Login Successful",
        "user": serialize_user(user)
    }


# Register API
@app.post("/register")
@app.post("/api/auth/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return register_user(payload, db)



# Login API
@app.post("/login")
@app.post("/api/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return login_user(payload, db)


@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found for this email")

    if (user.security_answer or "").lower().strip() != payload.security_answer.lower().strip():
        raise HTTPException(status_code=401, detail="Security answer does not match")

    user.password = payload.password
    db.commit()

    return {"success": True, "message": "Password reset successful"}



# Get All Users (Testing)
@app.get("/users")
def get_users(
    db: Session = Depends(get_db)
):

    users = db.query(User).all()

    return [serialize_user(user) for user in users]
