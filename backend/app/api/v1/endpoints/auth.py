from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.permissions import get_current_user
from app.models.admin_user import AdminUser
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.admin_user import AdminUserResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import (
    authenticate_admin,
    refresh_admin_token,
    request_password_reset,
    reset_password,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate administrator and return access & refresh JWT tokens."""
    return authenticate_admin(db, login_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh expired access token."""
    return refresh_admin_token(db, refresh_in.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: AdminUser = Depends(get_current_user)):
    """Logout current administrator."""
    return MessageResponse(message="Successfully logged out")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate password reset process."""
    result = request_password_reset(db, req.email)
    return MessageResponse(message=result)


@router.post("/reset-password", response_model=MessageResponse)
def reset_pwd(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Complete password reset using token."""
    reset_password(db, req)
    return MessageResponse(message="Password reset successfully. You can now login with your new password.")


@router.get("/me", response_model=AdminUserResponse)
def get_me(current_user: AdminUser = Depends(get_current_user)):
    """Retrieve details of currently authenticated admin."""
    return AdminUserResponse.model_validate(current_user)

