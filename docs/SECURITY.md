# MausamGuard Nepal - Cybersecurity & Governance Specification

## 1. Authentication Architecture
- **Stateless Bearer JWT Tokens**: Cryptographically signed using HMAC-SHA256 (`python-jose`).
- **Short-Lived Access Tokens**: Configured via `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60 minutes).
- **Long-Lived Refresh Tokens**: Stored securely for persistent sessions with revocation tracking.
- **Passphrase Encryption**: Native Blowfish `bcrypt` algorithm. Passwords are sliced to 72 bytes before hashing to protect against denial-of-service and buffer overflows.

## 2. Role-Based Access Control (RBAC)
The platform enforces a strict 4-tier Role Hierarchy:
| Role | Permissions | Use Case |
|---|---|---|
| **ADMIN** | Full system administration, user activation/deactivation, triggering safe data ingestion, reading audit logs | System Operators & Civil Defense IT |
| **ANALYST** | Read-only analytics, data quality audit inspection, full incident export | Disaster Risk Researchers |
| **OPERATOR** | Early warning monitoring, alert acknowledgment, alert resolution notes | DHM / NDRRMA Emergency Desk |
| **VIEWER** | Public read-only access to GIS map, district overviews, and public advisories | General Public & Farmers |

## 3. Defense-in-Depth Defenses
1. **Zero Raw SQL (SQL Injection Defense)**: All database interactions utilize SQLAlchemy ORM with parametrized queries. User inputs never concatenate into SQL strings.
2. **Pydantic Validation**: All incoming REST payloads undergo strict type coercion, regex constraints, and length boundaries via Pydantic v2.
3. **HTTP Security Headers Middleware**:
   - `Content-Security-Policy`: Restricts scripts and styles to trusted basemap and font CDNs.
   - `X-Content-Type-Options`: `nosniff`
   - `X-Frame-Options`: `DENY`
   - `Referrer-Policy`: `strict-origin-when-cross-origin`
   - `Permissions-Policy`: `geolocation=(), camera=(), microphone=()`
4. **CORS Hardening**: Strict origin whitelist configured via `CORS_ORIGINS`. Insecure wildcards (`*`) are disallowed in production mode.
5. **Rate Limiting**: Integrated `slowapi` throttling protecting public endpoints against brute-force attacks and volumetric DDoS.
6. **Audit Trails**: All authentication attempts, user state transitions, alert acknowledgments, and manual data refresh triggers are immutably logged into the `audit_logs` table.
