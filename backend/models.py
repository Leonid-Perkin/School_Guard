from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    fio = Column(String, nullable=False)
    pass_id = Column(String, nullable=False)
    last_pass_date = Column(String, nullable=False)
    gate_pass = Column(Boolean, default=False)
    turnstile_pass = Column(Boolean, default=False)
    cabinet_pass = Column(Boolean, default=False)
    cabinet_number = Column(Integer, default=0)
