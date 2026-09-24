from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Role, SavedLocation
from app.schemas.auth import UserLogin, UserCreate, Token, UserOut, SavedLocationCreate, SavedLocationOut
from app.schemas.common import ApiResponse
from app.security.auth import verify_password, get_password_hash, create_access_token
from app.security.permissions import get_current_user
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
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
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

    return ApiResponse(
        data=Token(
            access_token=token_str,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )
    )

@router.get("/me", response_model=ApiResponse[UserOut])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=current_user)

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
