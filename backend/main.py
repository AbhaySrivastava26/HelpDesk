from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from routes.tickets       import router as tickets_router
from routes.analytics     import router as analytics_router
from routes.health        import router as health_router
from routes.chat          import router as chat_router
from routes.teams         import router as teams_router
from routes.notifications import router as notifications_router   # NEW
from db.mongo import connect_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_db()
    yield
    close_db()

app = FastAPI(title="HelpIQ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:5173",
        "http://127.0.0.1:5173", "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router,         prefix="/api/health")
app.include_router(tickets_router,        prefix="/api/tickets")
app.include_router(analytics_router,      prefix="/api/analytics")
app.include_router(chat_router,           prefix="/api/chat")
app.include_router(teams_router,          prefix="/api/teams")
app.include_router(notifications_router,  prefix="/api/notifications")   # NEW

