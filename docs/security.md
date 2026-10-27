# FlowPilot AI — Security & Threat Model

## 1. Authentication & Session Security
- **Password Hashing**: Passwords hashed using bcrypt / Argon2 with individual salts and high work factors.
- **Server-Side Sessions**: Ephemeral session tokens stored in PostgreSQL with indexed hash lookup.
- **Cookie Flags**: `HttpOnly`, `SameSite=Lax`, and `Secure` (in production).
- **Session Expiration & Invalidation**: Expired sessions rejected; explicit logout deletes session from database.
- **Protection against Session Fixation**: Session rotated upon authentication state changes.

## 2. Resource-Level Authorization (IDOR Prevention)
- All workflow, execution, and integration routes enforce tenant isolation on the server:
  `WHERE id = :id AND ownerId = :currentUserId`
- Admin privileges verified through server-side role checks, never client-submitted role fields.

## 3. Sandboxing & Safe Evaluation
- **Zero Arbitrary Execution**: No `eval()`, `Function()`, `vm2`, or child process execution permitted for user inputs or AI suggestions.
- **Declarative Template Interpolation**: Safe regex-based variable replacement (`{{path.to.val}}`) with recursion limits and HTML escaping.
- **SSRF Protection on Webhook Node**:
  - Restricts IP addresses to public routable space (blocks `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` cloud metadata).
  - Validates protocol strictly to `https://` (or `http://` in explicit local dev config).
  - Maximum response body sizes and timeouts enforced.

## 4. Secret Storage & Zero-Leakage
- Integration secrets encrypted at rest via AES-256-GCM.
- Secrets never returned in API payloads or serialized to frontend state.
- Sensitive fields redacted from execution logs and step run records.
