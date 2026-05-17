# Bearer Token Authentication Implementation

## Overview

Your Guitar CRM API now supports bearer token authentication alongside session-based authentication. This allows external applications and services to authenticate requests without needing to handle passwords or session cookies.

## Features

✅ Generate per-user API keys  
✅ Revoke keys anytime  
✅ Track key usage with `last_used_at`  
✅ Secure hashing with SHA256  
✅ Row-level security (RLS) policies  
✅ Backward compatible with session auth  

## How to Use

### 1. Generate an API Key

**For Users:**
- Go to Settings → API Keys
- Click "Generate New Key"
- Copy the key immediately (it won't be shown again)
- Give it a memorable name

**Via API:**
```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{"name": "Mobile App"}'
```

Response:
```json
{
  "id": "uuid",
  "name": "Mobile App",
  "key": "gcrm_[base64-encoded-token]",
  "created_at": "2025-12-09T08:00:00Z",
  "warning": "Save your API key now. You will not be able to see it again."
}
```

### 2. Use the Bearer Token

Include the key in the `Authorization` header:

```bash
curl http://localhost:3000/api/songs/[song-id] \
  -H "Authorization: Bearer gcrm_[your-api-key]"
```

### 3. List Your API Keys

```bash
curl http://localhost:3000/api/api-keys \
  -H "Cookie: [session-cookie]"
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "Mobile App",
    "created_at": "2025-12-09T08:00:00Z",
    "last_used_at": "2025-12-09T10:30:00Z",
    "is_active": true
  }
]
```

### 4. Revoke an API Key

```bash
curl -X DELETE http://localhost:3000/api/api-keys/[key-id] \
  -H "Cookie: [session-cookie]"
```

## API Endpoints

### `GET /api/api-keys`
List all API keys for the authenticated user.

**Authentication:** Session cookie required  
**Response:** Array of API key metadata (without hashes)

### `POST /api/api-keys`
Create a new API key.

**Authentication:** Session cookie required  
**Body:**
```json
{
  "name": "Key Name"
}
```

**Response:** New API key object with plain text key

### `DELETE /api/api-keys/[id]`
Delete (revoke) an API key.

**Authentication:** Session cookie required  
**Response:** `{ "success": true }`

## Security Notes

- API keys are hashed with SHA256 before storage
- Only key owners can view, create, or delete their keys
- Keys are never displayed again after creation
- Use different keys for different integrations
- Rotate keys periodically
- Revoke keys immediately if compromised
- All API endpoints accept either bearer tokens or session cookies

## Implementation Details

### Database Schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,  -- SHA256 hash
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

### Authentication Flow

1. User sends request with `Authorization: Bearer [key]`
2. System hashes the provided key
3. Looks up matching key_hash in database
4. Verifies is_active flag
5. Returns user profile and user_id
6. Processes request in authenticated context
7. Updates last_used_at timestamp

### Backward Compatibility

All API endpoints support both authentication methods:
- Session cookies (existing)
- Bearer tokens (new)

The system tries bearer token first, then falls back to session cookies.

## Next Steps

- [ ] Add API key management UI to Settings
- [ ] Implement key expiration (optional)
- [ ] Add rate limiting per API key
- [ ] Create audit logs for API key usage
- [ ] Add scope/permission restrictions to keys
