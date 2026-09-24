import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from app.config import settings

logger = logging.getLogger("mausamguard.security")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()
        
        response: Response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Attach security headers (Requirement 25)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        
        # In production HTTPS deployment, enforce HSTS
        if settings.PRODUCTION_MODE:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        return response
