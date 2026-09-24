from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: Optional[str] = None
    details: Optional[Any] = None

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    disclaimer: Optional[str] = (
        "Official DHM/NDRRMA warnings should remain the authoritative government source."
    )

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_records: int
    total_pages: int
    has_next: bool
    has_prev: bool

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    pagination: PaginationMeta
    disclaimer: Optional[str] = (
        "Official DHM/NDRRMA warnings should remain the authoritative government source."
    )
