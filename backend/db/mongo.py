from pymongo import MongoClient
from config import settings

client = None
db = None

def connect_db():
    """Connect to MongoDB"""
    global client, db
    try:
        client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        db = client[settings.MONGO_DB]
        print("✓ Connected to MongoDB")
    except Exception as e:
        print(f"✗ MongoDB Error: {e}")
        print("⚠️  Running in demo mode (data won't persist)")
        db = None

def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✓ MongoDB closed")

def get_db():
    """Get database instance"""
    if db is None:
        print("⚠️  Database not connected")
        return None
    return db