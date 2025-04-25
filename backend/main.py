from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import List
from database import SessionLocal, engine, Base
from models import User, Student
import paho.mqtt.client as mqtt
import json
Base.metadata.create_all(bind=engine)
app = FastAPI()
origins = [
    "http://localhost:5173", 
    "http://127.0.0.1",     
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883
MQTT_USERNAME = "leonid"
MQTT_PASSWORD = "2006"
MQTT_TOPIC_SUB = "esp8266/pass_id"
MQTT_TOPIC_PUB = "esp8266/gate_control"
MQTT_TOPIC_SUB_2 = "esp8266/pass_id_2"
MQTT_TOPIC_PUB_2 = "esp8266/turnstile_pass"
MQTT_TOPIC_SUB_3 = "esp8266/pass_id_3"
MQTT_TOPIC_PUB_3 = "esp8266/cabinet_pass"
#mqtt_client = mqtt.Client()
#mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
#mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe(MQTT_TOPIC_SUB)
    client.subscribe(MQTT_TOPIC_SUB_2)
    client.subscribe(MQTT_TOPIC_SUB_3)
def on_message(client, userdata, msg):
    print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")
    pass_id = msg.payload.decode()
    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.pass_id == pass_id).first()
        if student:
            if msg.topic == MQTT_TOPIC_SUB:
                student.gate_pass = True
                response_topic = MQTT_TOPIC_PUB
            elif msg.topic == MQTT_TOPIC_SUB_2:
                student.turnstile_pass = True
                response_topic = MQTT_TOPIC_PUB_2
            elif msg.topic == MQTT_TOPIC_SUB_3:
                student.cabinet_pass = True
                response_topic = MQTT_TOPIC_PUB_3
            db.commit() 
            print(f"Student with pass_id {pass_id} updated: {msg.topic} set to True")
            response = {"pass_id": pass_id, "access_granted": True}
        else:
            response = {"pass_id": pass_id, "access_granted": False}
        client.publish(response_topic, json.dumps(response))
    except Exception as e:
        print(f"Error updating student: {e}")
        db.rollback()
    finally:
        db.close()
#mqtt_client.on_connect = on_connect
#mqtt_client.on_message = on_message
#mqtt_client.loop_start()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
class StudentBase(BaseModel):
    fio: str
    pass_id: str
    last_pass_date: str
    gate_pass: bool
    turnstile_pass: bool
    cabinet_pass: bool
    cabinet_number: int
class StudentCreate(StudentBase):
    pass
class StudentUpdate(StudentBase):
    pass
class UserCreate(BaseModel):
    username: str
    password: str
class PasswordChange(BaseModel):
    new_password: str

class UserResponse(BaseModel):
    username: str
    is_admin: bool
    
    class Config:
        from_attributes = True
def get_password_hash(password: str):
    return pwd_context.hash(password)
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == token).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")
    return user
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": user.username, "token_type": "bearer"}

@app.get("/students", response_model=List[StudentBase])
def get_students(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == token).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")
    return db.query(Student).all()

@app.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"username": user.username, "is_admin": user.is_admin}

@app.post("/users")
def create_user(user_data: UserCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    new_user = User(username=user_data.username, hashed_password=get_password_hash(user_data.password))
    db.add(new_user)
    db.commit()
    return {"message": "Пользователь создан"}

@app.put("/users/{username}/password")
def change_password(username: str, password_data: PasswordChange, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    user_to_update = db.query(User).filter(User.username == username).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user_to_update.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Пароль изменён"}

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    users = db.query(User).all()
    return users

@app.post("/students", response_model=StudentBase)
def create_student(student_data: StudentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    new_student = Student(**student_data.dict())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student
@app.delete("/students/{pass_id}")
def delete_student(pass_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    student = db.query(Student).filter(Student.pass_id == pass_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    db.delete(student)
    db.commit()
    return {"message": "Студент удалён"}
@app.put("/students/{pass_id}", response_model=StudentBase)
def update_student(pass_id: str, student_data: StudentUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    student = db.query(Student).filter(Student.pass_id == pass_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    for key, value in student_data.dict().items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student
@app.delete("/users/{username}")
def delete_user(username: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    user_to_delete = db.query(User).filter(User.username == username).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    db.delete(user_to_delete)
    db.commit()
    return {"message": "Пользователь удалён"}
