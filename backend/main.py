from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from routes.tickets import router as tickets_router
from routes.analytics import router as analytics_router
from routes.health import router as health_router
from db.mongo import connect_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    connect_db()
    yield
    # Shutdown
    close_db()

app = FastAPI(
    title="HelpIQ API",
    description="Enterprise IT Support System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/health", tags=["health"])
app.include_router(tickets_router, prefix="/api/tickets", tags=["tickets"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)