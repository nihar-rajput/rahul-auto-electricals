from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.permissions import get_current_user, require_super_admin
from app.models.admin_user import AdminUser
from app.schemas.admin_user import (
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserResponse,
)
from app.schemas.common import MessageResponse
from app.services.auth_service import (
    create_admin_user,
    list_admin_users,
    update_admin_user,
    delete_admin_user,
)

router = APIRouter()


@router.get("/users", response_model=List[AdminUserResponse])
def get_admin_users(
    db: Session = Depends(get_db),
    super_admin: AdminUser = Depends(require_super_admin),
):
    """List all authorized administrator accounts (Super Admin only)."""
    return list_admin_users(db)


@router.post("/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def add_admin_user(
    user_in: AdminUserCreate,
    db: Session = Depends(get_db),
    super_admin: AdminUser = Depends(require_super_admin),
):
    """Create a new authorized administrator account (Super Admin only)."""
    return create_admin_user(db, creator=super_admin, user_in=user_in)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def modify_admin_user(
    user_id: str,
    user_in: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    """Update administrator account (Super Admin, or user updating self)."""
    return update_admin_user(db, current_user=current_user, user_id=user_id, user_in=user_in)


@router.delete("/users/{user_id}", response_model=MessageResponse)
def remove_admin_user(
    user_id: str,
    db: Session = Depends(get_db),
    super_admin: AdminUser = Depends(require_super_admin),
):
    """Delete administrator account (Super Admin only)."""
    delete_admin_user(db, current_user=super_admin, user_id=user_id)
    return MessageResponse(message="Admin account deleted successfully")

