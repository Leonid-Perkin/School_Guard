from database import SessionLocal, engine, Base
from models import User
from passlib.context import CryptContext
Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()
admin_user = db.query(User).filter(User.username == "admin").first()
if not admin_user:
    new_admin = User(username="admin", hashed_password=pwd_context.hash("admin"), is_admin=True)
    db.add(new_admin)
    db.commit()
    print("✅ Администратор создан! Логин: admin, Пароль: admin")
else:
    print("⚠️ Администратор уже существует!")
db.close()