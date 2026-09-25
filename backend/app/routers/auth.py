from typing import Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Role, SavedLocation
from app.schemas.auth import UserLogin, UserCreate, PasswordChange, Token, UserOut, SavedLocationCreate, SavedLocationOut
from app.schemas.common import ApiResponse
from app.security.auth import verify_password, get_password_hash, create_access_token
from app.security.permissions import get_current_user, get_current_user_optional
from app.services.audit_service import log_audit_event
from app.config import settings
from app.utils.timezone import utc_now

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=ApiResponse[UserOut])
def register_user(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already registered."
        )

    # Assign VIEWER role by default
    viewer_role = db.query(Role).filter(Role.name == "VIEWER").first()
    if not viewer_role:
        viewer_role = Role(name="VIEWER", description="Standard public viewer")
        db.add(viewer_role)
        db.commit()
        db.refresh(viewer_role)

    new_user = User(
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        created_at=utc_now()
    )
    new_user.roles.append(viewer_role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="user_register",
        user_id=new_user.id,
        username=new_user.username,
        resource="users",
        ip_address=request.client.host if request.client else None
    )

    return ApiResponse(data=new_user)

@router.post("/login", response_model=ApiResponse[Token])
def login(payload: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == payload.username_or_email) | (User.email == payload.username_or_email)
    ).first()

    ip_addr = request.client.host if request.client else None

    if not user or not verify_password(payload.password, user.hashed_password):
        log_audit_event(
            db=db,
            action="failed_login",
            username=payload.username_or_email,
            status="FAILED",
            ip_address=ip_addr
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password."
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated.")

    roles = [r.name for r in user.roles]
    token_str = create_access_token(subject=user.username, user_id=user.id, roles=roles)

    user.last_login = utc_now()
    db.commit()

    log_audit_event(
        db=db,
        action="login",
        user_id=user.id,
        username=user.username,
        ip_address=ip_addr
    )

    # Set secure HttpOnly session cookie
    is_secure = settings.ENVIRONMENT.lower() == "production"
    response.set_cookie(
        key="mg_access_token",
        value=token_str,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=is_secure,
        path="/"
    )

    return ApiResponse(
        data=Token(
            access_token=token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )
    )

@router.post("/logout", response_model=ApiResponse[bool])
def logout(
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Clear session cookie and log audit record."""
    response.delete_cookie(key="mg_access_token", path="/")
    if current_user:
        log_audit_event(
            db=db,
            action="logout",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=request.client.host if request.client else None
        )
    return ApiResponse(data=True)

@router.get("/me", response_model=ApiResponse[UserOut])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=current_user)

@router.post("/change-password", response_model=ApiResponse[dict])
def change_password(
    payload: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Secure password modification endpoint.
    Verifies existing credentials, validates new password complexity,
    updates hash via bcrypt, and records security audit trail.
    """
    ip_addr = request.client.host if request.client else None

    # 1. Verify current password
    if not verify_password(payload.current_password, current_user.hashed_password):
        log_audit_event(
            db=db,
            action="password_change_failed",
            user_id=current_user.id,
            username=current_user.username,
            status="FAILED",
            details={"reason": "Incorrect current password verification"},
            ip_address=ip_addr
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="हालको पासवर्ड मिलेन (Current password does not match)."
        )

    # 2. Strict password validation
    new_pw = payload.new_password.strip()
    if len(new_pw) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="नयाँ पासवर्ड कम्तिमा ८ अक्षरको हुनुपर्छ (New password must be at least 8 characters)."
        )
    if new_pw == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="नयाँ पासवर्ड हालको पासवर्ड भन्दा फरक हुनुपर्छ (New password must be different from current password)."
        )

    # 3. Hash and save new password
    current_user.hashed_password = get_password_hash(new_pw)
    db.commit()

    # 4. Audit trail
    log_audit_event(
        db=db,
        action="password_change_success",
        user_id=current_user.id,
        username=current_user.username,
        status="SUCCESS",
        details={"message": "Password successfully updated via secure authenticated portal"},
        ip_address=ip_addr
    )

    return ApiResponse(data={"message": "पासवर्ड सफलतापूर्वक परिवर्तन गरियो (Password updated successfully)."})

@router.post("/saved-locations", response_model=ApiResponse[SavedLocationOut])
def add_saved_location(
    payload: SavedLocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loc = SavedLocation(
        user_id=current_user.id,
        name=payload.name,
        district_name=payload.district_name,
        municipality_name=payload.municipality_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        alert_enabled=payload.alert_enabled
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return ApiResponse(data=loc)

@router.delete("/saved-locations/{location_id}", response_model=ApiResponse[bool])
def delete_saved_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loc = db.query(SavedLocation).filter(
        SavedLocation.id == location_id,
        SavedLocation.user_id == current_user.id
    ).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")
    db.delete(loc)
    db.commit()
    return ApiResponse(data=True)
