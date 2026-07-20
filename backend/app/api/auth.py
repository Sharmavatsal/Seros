from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.models.user import User

from app.schemas.login import LoginRequest

from app.auth.password import verify_password
from app.auth.jwt_handler import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login")
def login(data: LoginRequest):

    db: Session = SessionLocal()

    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": str(user.id),
            "username": user.full_name or user.email.split("@")[0],
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    }