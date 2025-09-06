from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import json
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import asyncio

app = FastAPI(title="EcoFINDS API", description="Sustainable Second-hand Marketplace")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# In-memory storage with dummy data
users_db = {}
items_db = {}
messages_db = {}
transactions_db = {}
active_connections = {}

# Models
class User(BaseModel):
    id: str = None
    email: EmailStr
    username: str
    full_name: str
    eco_points: int = 100
    created_at: datetime = None

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Item(BaseModel):
    id: str = None
    title: str
    description: str
    price: float
    category: str
    condition: str
    images: List[str] = []
    seller_id: str
    eco_points_reward: int = 10
    is_available: bool = True
    created_at: datetime = None

class ItemCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str
    condition: str
    images: List[str] = []

class Message(BaseModel):
    id: str = None
    item_id: str
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime = None

class MessageCreate(BaseModel):
    item_id: str
    receiver_id: str
    content: str

class Transaction(BaseModel):
    id: str = None
    item_id: str
    buyer_id: str
    seller_id: str
    amount: float
    eco_points_earned: int
    status: str = "completed"
    created_at: datetime = None

# Initialize dummy data
def initialize_dummy_data():
    global users_db, items_db
    
    # Dummy users
    dummy_users = [
        {
            "id": "user1",
            "email": "john@example.com",
            "username": "john_eco",
            "full_name": "John Doe",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
            "eco_points": 150,
            "created_at": "2024-01-15T10:00:00Z"
        },
        {
            "id": "user2",
            "email": "alice@example.com",
            "username": "alice_green",
            "full_name": "Alice Smith",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
            "eco_points": 200,
            "created_at": "2024-01-10T09:00:00Z"
        },
        {
            "id": "user3",
            "email": "bob@example.com",
            "username": "bob_sustainable",
            "full_name": "Bob Johnson",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # secret
            "eco_points": 75,
            "created_at": "2024-01-20T11:00:00Z"
        }
    ]
    
    for user in dummy_users:
        users_db[user["id"]] = user
    
    # Dummy items
    dummy_items = [
        {
            "id": "item1",
            "title": "iPhone 12 Pro - Excellent Condition",
            "description": "Barely used iPhone 12 Pro in perfect condition. Comes with original charger and box. No scratches or dents.",
            "price": 599.99,
            "category": "Electronics",
            "condition": "Excellent",
            "images": ["https://images.unsplash.com/photo-1592286948467-b6d18a6a3930?w=500"],
            "seller_id": "user1",
            "eco_points_reward": 15,
            "is_available": True,
            "created_at": "2024-01-16T10:30:00Z"
        },
        {
            "id": "item2",
            "title": "Vintage Leather Jacket",
            "description": "Classic brown leather jacket from the 80s. Real leather, still in great shape. Size Medium.",
            "price": 89.99,
            "category": "Clothing",
            "condition": "Good",
            "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
            "seller_id": "user2",
            "eco_points_reward": 10,
            "is_available": True,
            "created_at": "2024-01-12T14:20:00Z"
        },
        {
            "id": "item3",
            "title": "JavaScript Programming Books Set",
            "description": "Collection of 5 JavaScript programming books including ES6, React, and Node.js guides. Perfect for beginners and intermediate developers.",
            "price": 45.00,
            "category": "Books",
            "condition": "Good",
            "images": ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"],
            "seller_id": "user1",
            "eco_points_reward": 8,
            "is_available": True,
            "created_at": "2024-01-18T16:00:00Z"
        },
        {
            "id": "item4",
            "title": "Gaming Mechanical Keyboard",
            "description": "RGB mechanical keyboard with blue switches. Perfect for gaming and typing. Barely used, like new condition.",
            "price": 120.00,
            "category": "Electronics",
            "condition": "Excellent",
            "images": ["https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500"],
            "seller_id": "user3",
            "eco_points_reward": 12,
            "is_available": True,
            "created_at": "2024-01-21T12:15:00Z"
        },
        {
            "id": "item5",
            "title": "Ceramic Plant Pots Set",
            "description": "Beautiful set of 3 ceramic plant pots in different sizes. Perfect for indoor plants. White with gold accents.",
            "price": 35.00,
            "category": "Home & Garden",
            "condition": "Excellent",
            "images": ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500"],
            "seller_id": "user2",
            "eco_points_reward": 8,
            "is_available": True,
            "created_at": "2024-01-14T09:45:00Z"
        },
        {
            "id": "item6",
            "title": "Nike Running Shoes Size 9",
            "description": "Nike Air Max running shoes, size 9. Used but still in good condition. Great for jogging and casual wear.",
            "price": 65.00,
            "category": "Sports",
            "condition": "Good",
            "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"],
            "seller_id": "user3",
            "eco_points_reward": 10,
            "is_available": True,
            "created_at": "2024-01-19T13:30:00Z"
        },
        {
            "id": "item7",
            "title": "Wooden Coffee Table",
            "description": "Solid wood coffee table with storage drawers. Perfect for living room. Some minor wear but very sturdy.",
            "price": 180.00,
            "category": "Home & Garden",
            "condition": "Good",
            "images": ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"],
            "seller_id": "user1",
            "eco_points_reward": 18,
            "is_available": True,
            "created_at": "2024-01-17T11:00:00Z"
        },
        {
            "id": "item8",
            "title": "Designer Sunglasses",
            "description": "Ray-Ban Aviator sunglasses in excellent condition. Comes with original case and cleaning cloth.",
            "price": 95.00,
            "category": "Clothing",
            "condition": "Excellent",
            "images": ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500"],
            "seller_id": "user2",
            "eco_points_reward": 10,
            "is_available": True,
            "created_at": "2024-01-13T15:20:00Z"
        }
    ]
    
    for item in dummy_items:
        items_db[item["id"]] = item

# Initialize dummy data on startup
initialize_dummy_data()

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = users_db.get(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))

manager = ConnectionManager()

# Auth endpoints
@app.post("/auth/register")
async def register(user: UserCreate):
    if any(u["email"] == user.email for u in users_db.values()):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    users_db[user_id] = {
        "id": user_id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "password": hashed_password,
        "eco_points": 100,
        "created_at": datetime.utcnow().isoformat()
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}

@app.post("/auth/login")
async def login(user_login: UserLogin):
    user = None
    for u in users_db.values():
        if u["email"] == user_login.email:
            user = u
            break
    
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user["id"]}

# User endpoints
@app.get("/users/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {k: v for k, v in user.items() if k != "password"}

# Items endpoints
@app.get("/items")
async def get_items(category: Optional[str] = None, search: Optional[str] = None):
    items = list(items_db.values())
    
    if category:
        items = [item for item in items if item["category"].lower() == category.lower()]
    
    if search:
        items = [item for item in items if 
                search.lower() in item["title"].lower() or 
                search.lower() in item["description"].lower()]
    
    # Add seller info
    for item in items:
        seller = users_db.get(item["seller_id"])
        if seller:
            item["seller_name"] = seller["username"]
    
    return items

@app.get("/items/{item_id}")
async def get_item(item_id: str):
    item = items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Add seller info
    seller = users_db.get(item["seller_id"])
    if seller:
        item["seller_name"] = seller["username"]
        item["seller_email"] = seller["email"]
    
    return item

@app.post("/items")
async def create_item(item: ItemCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    
    items_db[item_id] = {
        "id": item_id,
        "title": item.title,
        "description": item.description,
        "price": item.price,
        "category": item.category,
        "condition": item.condition,
        "images": item.images,
        "seller_id": current_user["id"],
        "eco_points_reward": max(5, int(item.price * 0.02)),  # Dynamic eco points based on price
        "is_available": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    return items_db[item_id]

@app.get("/items/user/{user_id}")
async def get_user_items(user_id: str):
    items = [item for item in items_db.values() if item["seller_id"] == user_id]
    return items

# Purchase endpoint
@app.post("/items/{item_id}/purchase")
async def purchase_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if not item["is_available"]:
        raise HTTPException(status_code=400, detail="Item not available")
    
    if item["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot purchase your own item")
    
    # Mark item as sold
    items_db[item_id]["is_available"] = False
    
    # Award eco points to buyer
    users_db[current_user["id"]]["eco_points"] += item["eco_points_reward"]
    
    # Create transaction
    transaction_id = str(uuid.uuid4())
    transactions_db[transaction_id] = {
        "id": transaction_id,
        "item_id": item_id,
        "buyer_id": current_user["id"],
        "seller_id": item["seller_id"],
        "amount": item["price"],
        "eco_points_earned": item["eco_points_reward"],
        "status": "completed",
        "created_at": datetime.utcnow().isoformat()
    }
    
    return {"message": "Purchase successful", "eco_points_earned": item["eco_points_reward"]}

# Messages endpoints
@app.get("/messages/{item_id}")
async def get_messages(item_id: str, current_user: dict = Depends(get_current_user)):
    messages = [msg for msg in messages_db.values() if msg["item_id"] == item_id and 
               (msg["sender_id"] == current_user["id"] or msg["receiver_id"] == current_user["id"])]
    
    # Add sender info
    for msg in messages:
        sender = users_db.get(msg["sender_id"])
        if sender:
            msg["sender_name"] = sender["username"]
    
    return sorted(messages, key=lambda x: x["timestamp"])

@app.post("/messages")
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    message_id = str(uuid.uuid4())
    
    new_message = {
        "id": message_id,
        "item_id": message.item_id,
        "sender_id": current_user["id"],
        "receiver_id": message.receiver_id,
        "content": message.content,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    messages_db[message_id] = new_message
    
    # Send real-time message via WebSocket
    await manager.send_message({
        "type": "new_message",
        "message": {**new_message, "sender_name": current_user["username"]}
    }, message.receiver_id)
    
    return new_message

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Transactions endpoint
@app.get("/transactions")
async def get_user_transactions(current_user: dict = Depends(get_current_user)):
    transactions = [t for t in transactions_db.values() if 
                   t["buyer_id"] == current_user["id"] or t["seller_id"] == current_user["id"]]
    
    # Add item and user info
    for transaction in transactions:
        item = items_db.get(transaction["item_id"])
        if item:
            transaction["item_title"] = item["title"]
        
        if transaction["buyer_id"] == current_user["id"]:
            transaction["type"] = "purchase"
            seller = users_db.get(transaction["seller_id"])
            if seller:
                transaction["other_user"] = seller["username"]
        else:
            transaction["type"] = "sale"
            buyer = users_db.get(transaction["buyer_id"])
            if buyer:
                transaction["other_user"] = buyer["username"]
    
    return sorted(transactions, key=lambda x: x["created_at"], reverse=True)

# Endpoint to get dummy data info (for testing)
@app.get("/dummy-data")
async def get_dummy_data():
    return {
        "message": "Dummy data loaded successfully!",
        "users_count": len(users_db),
        "items_count": len(items_db),
        "sample_credentials": {
            "email": "john@example.com",
            "password": "secret"
        },
        "note": "You can login with any of these emails: john@example.com, alice@example.com, bob@example.com (password: secret)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)