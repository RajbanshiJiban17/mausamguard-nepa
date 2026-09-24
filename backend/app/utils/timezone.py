from datetime import datetime, timezone

def utc_now() -> datetime:
    """Returns clean UTC datetime compliant with Python 3.12+ (replaces deprecated utcnow())."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

def utc_now_iso() -> str:
    """Returns ISO format UTC string."""
    return utc_now().isoformat()
