from fastapi import status


def test_login_success(client, superadmin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": superadmin_user.email, "password": "SuperSecret123!"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == superadmin_user.email
    assert data["user"]["role"] == "SUPER_ADMIN"


def test_login_invalid_password(client, superadmin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": superadmin_user.email, "password": "WrongPassword!"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_me_endpoint(client, superadmin_headers, superadmin_user):
    response = client.get("/api/v1/auth/me", headers=superadmin_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == superadmin_user.email


def test_superadmin_can_create_new_admin(client, superadmin_headers):
    response = client.post(
        "/api/v1/admin/users",
        headers=superadmin_headers,
        json={
            "name": "New Assistant",
            "email": "assistant@rahulautoelectricals.com",
            "password": "Password123!",
            "role": "ADMIN",
            "is_active": True,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "assistant@rahulautoelectricals.com"
    assert data["role"] == "ADMIN"


def test_regular_admin_cannot_create_admins(client, regular_admin_headers):
    response = client.post(
        "/api/v1/admin/users",
        headers=regular_admin_headers,
        json={
            "name": "Unauthorized Add",
            "email": "fail@rahulautoelectricals.com",
            "password": "Password123!",
            "role": "ADMIN",
            "is_active": True,
        },
    )
    # Must fail with 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_password_reset_flow(client, db, superadmin_user):
    # 1. Request reset
    req_resp = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": superadmin_user.email},
    )
    assert req_resp.status_code == status.HTTP_200_OK

    # Inspect token stored on user
    db.refresh(superadmin_user)
    token = superadmin_user.reset_token
    assert token is not None

    # 2. Reset with token
    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "BrandNewPassword2026!"},
    )
    assert reset_resp.status_code == status.HTTP_200_OK

    # 3. Login with new password
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": superadmin_user.email, "password": "BrandNewPassword2026!"},
    )
    assert login_resp.status_code == status.HTTP_200_OK

