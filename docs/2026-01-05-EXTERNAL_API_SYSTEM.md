# External Database API System

This system provides a unified API interface that automatically routes HTTP requests to either local or remote Supabase databases based on your environment configuration.

## 🎯 Key Features

- **Automatic Environment Detection**: Routes to local/remote database based on configuration
- **Unified API Interface**: Consistent interface regardless of database location
- **Type Safety**: Full TypeScript support with database schema types
- **HTTP Method Support**: GET, POST, PUT, PATCH, DELETE operations
- **Error Handling**: Comprehensive error handling with database context
- **Logging**: Detailed logging with environment indicators

## 🏗️ Architecture

### Core Components

1. **DatabaseRouter** (`lib/api/database-router.ts`)
   - Detects active database configuration (local vs remote)
   - Handles HTTP requests with appropriate headers and authentication
   - Provides detailed logging with environment context

2. **UnifiedDatabaseAPI** (`lib/api/unified-db.ts`)
   - Type-safe database operations
   - Convenience methods for common CRUD operations
   - Support for RPC functions and raw queries

3. **External API Routes** (`app/api/external/`)
   - REST endpoints for external application integration
   - Automatic database routing
   - Response includes database context

## 📚 Usage Examples

### Basic Database Operations

```typescript
import { db } from '@/lib/api/unified-db';

// Get all songs (automatically routes to local/remote)
const songs = await db.songs.findAll({
  filter: { level: 'beginner' },
  limit: 10
});

// Create a new song
const newSong = await db.songs.create({
  title: 'Wonderwall',
  author: 'Oasis',
  level: 'beginner',
  key: 'Em'
});

// Update a song
const updated = await db.songs.update('song-id', {
  title: 'Updated Title'
});

// Delete a song
await db.songs.delete('song-id');
```

### Using the Raw Database Router

```typescript
import { dbRouter } from '@/lib/api/database-router';

// Direct HTTP requests
const response = await dbRouter.get('/songs', {
  limit: '10',
  order: 'created_at.desc'
});

const newRecord = await dbRouter.post('/songs', {
  title: 'New Song',
  author: 'Artist Name'
});
```

### External HTTP API

```bash
# Get database status
curl http://localhost:3000/api/external/database/status

# Get all songs
curl http://localhost:3000/api/external/songs

# Get songs with filters
curl "http://localhost:3000/api/external/songs?level=beginner&limit=5"

# Create a new song
curl -X POST http://localhost:3000/api/external/songs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Song",
    "author": "Test Artist", 
    "level": "beginner",
    "key": "C"
  }'

# Update a song
curl -X PUT http://localhost:3000/api/external/songs/SONG_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete a song
curl -X DELETE http://localhost:3000/api/external/songs/SONG_ID
```

## 🔧 Environment Configuration

The system automatically detects your database configuration:

### Local Database (Priority)
```env
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY=your_local_anon_key
```

### Remote Database (Fallback)
```env
NEXT_PUBLIC_SUPABASE_REMOTE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_REMOTE_ANON_KEY=your_remote_anon_key
```

## 📊 Database Status API

Check which database is currently being used:

```bash
curl http://localhost:3000/api/external/database/status
```

Response includes:
- Database type (local/remote)
- Connection status
- Basic statistics
- Environment information

## 🧪 Testing the System

Run the demonstration script:

```bash
npm run demo:api
```

This script will:
1. Check database status
2. Perform CRUD operations on songs
3. Test various API endpoints
4. Show database routing in action

## 🔍 Logging and Debugging

The system provides detailed logging:

- `🏠 [LOCAL-API]` - Requests to local database
- `☁️  [REMOTE-API]` - Requests to remote database
- `🔄 [DatabaseRouter]` - Environment detection
- `❌ [External API]` - Error situations

## 🚀 Response Format

All API responses include database context:

```json
{
  "songs": [...],
  "meta": {
    "database": "local",
    "count": 10
  }
}
```

## 🔐 Security Considerations

- API keys are handled through environment variables
- All requests use proper Supabase authentication headers
- Database context is included in responses for transparency
- Error messages include appropriate detail levels

## 🛠️ Extending the System

### Adding New Endpoints

1. Create route handler in `app/api/external/`
2. Use `db` convenience functions or raw `dbRouter`
3. Include database context in responses

### Adding New Database Operations

1. Extend `UnifiedDatabaseAPI` class
2. Add convenience methods to `db` export
3. Maintain type safety with database schema

## 📈 Performance

- Single database connection per request
- Automatic connection pooling through Supabase
- Efficient query building with proper indexing
- Minimal overhead for routing logic

## 🐛 Troubleshooting

### Database Not Found
- Check environment variables
- Ensure local Supabase is running (if using local)
- Verify remote Supabase URL (if using remote)

### Connection Errors
- Check network connectivity
- Verify API keys are correct
- Check Supabase service status

### Type Errors
- Ensure database types are up to date
- Regenerate types: `supabase gen types typescript`

---

This system provides a seamless way to work with your database regardless of environment, making your application truly portable and development-friendly.