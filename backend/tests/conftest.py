import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.models.brand import Brand
from app.models.product_category import ProductCategory
from app.models.website_settings import WebsiteSettings
from app.core.security import get_password_hash, create_access_token

# In-memory SQLite for high-speed isolated tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Initialize default website settings
    settings_rec = session.query(WebsiteSettings).filter(WebsiteSettings.id == "default_settings").first()
    if not settings_rec:
        settings_rec = WebsiteSettings(
            id="default_settings",
            business_name="Rahul Auto Electricals",
            default_stock_visibility_mode="SIMPLE_STATUS",
            default_low_stock_threshold=5,
        )
        session.add(settings_rec)
        session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def superadmin_user(db):
    user = AdminUser(
        name="Super Admin",
        email="super@rahulautoelectricals.com",
        password_hash=get_password_hash("SuperSecret123!"),
        role="SUPER_ADMIN",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def regular_admin_user(db):
    user = AdminUser(
        name="Store Admin",
        email="store@rahulautoelectricals.com",
        password_hash=get_password_hash("StoreSecret123!"),
        role="ADMIN",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def superadmin_headers(superadmin_user):
    token = create_access_token(subject=superadmin_user.id, role=superadmin_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def regular_admin_headers(regular_admin_user):
    token = create_access_token(subject=regular_admin_user.id, role=regular_admin_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_brand(db):
    brand = db.query(Brand).filter(Brand.slug == "powerzone").first()
    if not brand:
        brand = Brand(name="PowerZone", slug="powerzone", is_active=True)
        db.add(brand)
        db.commit()
        db.refresh(brand)
    return brand


@pytest.fixture
def test_category(db):
    category = db.query(ProductCategory).filter(ProductCategory.slug == "batteries").first()
    if not category:
        category = ProductCategory(name="Batteries", slug="batteries")
        db.add(category)
        db.commit()
        db.refresh(category)
    return category

