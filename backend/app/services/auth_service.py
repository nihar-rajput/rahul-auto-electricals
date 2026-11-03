import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.admin_user import AdminUser
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas.auth import LoginRequest, TokenResponse, ResetPasswordRequest
from app.schemas.admin_user import AdminUserCreate, AdminUserUpdate, AdminUserResponse


def authenticate_admin(db: Session, login_data: LoginRequest) -> TokenResponse:
    """Authenticate an administrator and generate JWT tokens."""
    user = (
        db.query(AdminUser)
        .filter(AdminUser.email == login_data.email.lower().strip())
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your admin account has been deactivated. Please contact the Super Admin.",
        )

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=60 * 24 * 60,  # 24 hours in seconds
        user=AdminUserResponse.model_validate(user),
    )


def refresh_admin_token(db: Session, refresh_token: str) -> TokenResponse:
    """Refresh access token using valid refresh token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active",
        )

    new_access = create_access_token(subject=user.id, role=user.role)
    new_refresh = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        expires_in=60 * 24 * 60,
        user=AdminUserResponse.model_validate(user),
    )


def request_password_reset(db: Session, email: str) -> str:
    """Generate a password reset token for the given admin email."""
    user = db.query(AdminUser).filter(AdminUser.email == email.lower().strip()).first()
    if not user:
        # Prevent email enumeration by returning a generic response
        return "If the account exists, a password reset token has been generated."

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=2)
    db.commit()

    # If SMTP is configured, this would send an email. For now, token is recorded.
    return f"Reset token generated for {user.email}: {token}"


def reset_password(db: Session, reset_data: ResetPasswordRequest) -> bool:
    """Reset admin password using token."""
    user = (
        db.query(AdminUser)
        .filter(AdminUser.reset_token == reset_data.token)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")

    if not user.reset_token_expires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")

    now = datetime.now(timezone.utc)
    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")

    user.password_hash = get_password_hash(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return True


def create_admin_user(db: Session, creator: AdminUser, user_in: AdminUserCreate) -> AdminUserResponse:
    """Create a new admin user (Restricted to Super Admin)."""
    # Enforce Super Admin only
    if creator.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create new administrators",
        )

    # Check for existing email
    existing = db.query(AdminUser).filter(AdminUser.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An admin with this email address already exists",
        )

    user = AdminUser(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AdminUserResponse.model_validate(user)


def list_admin_users(db: Session) -> List[AdminUserResponse]:
    """List all admin accounts."""
    users = db.query(AdminUser).order_by(AdminUser.created_at).all()
    return [AdminUserResponse.model_validate(u) for u in users]


def update_admin_user(
    db: Session,
    current_user: AdminUser,
    user_id: str,
    user_in: AdminUserUpdate
) -> AdminUserResponse:
    """Update admin account."""
    if current_user.role != "SUPER_ADMIN" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to update other admin accounts",
        )

    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    update_data = user_in.model_dump(exclude_unset=True)

    # Regular admin cannot promote to or demote Super Admin
    if "role" in update_data and current_user.role != "SUPER_ADMIN":
        del update_data["role"]

    if "password" in update_data and update_data["password"]:
        user.password_hash = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        if value is not None:
            setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return AdminUserResponse.model_validate(user)


def delete_admin_user(db: Session, current_user: AdminUser, user_id: str) -> bool:
    """Delete admin account (Super Admin only)."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete administrators",
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account",
        )

    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    db.delete(user)
    db.commit()
    return True
