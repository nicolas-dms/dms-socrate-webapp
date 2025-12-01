# 🔧 Fix: Docker Build OpenAPI Sync Error

## Problem

Docker build was failing with:
```
❌ Erreur lors de la synchronisation:
   Erreur de connexion: 
   
npm run build failed: exit code 1
```

The `prebuild` script was trying to sync the OpenAPI schema from `localhost:8000` during Docker build, but the backend isn't available in the build environment.

---

## Solution Applied

### 1. Updated `Dockerfile`

Added environment variable to skip API sync during Docker builds:

```dockerfile
# Skip API sync during Docker build (backend not available)
ENV DOCKER_BUILD=1
```

### 2. Updated `scripts/sync-openapi.js`

Made the script exit gracefully when backend is unavailable in Docker/CI environments:

```javascript
// Exit with 0 if we're in a Docker build or CI environment
if (process.env.DOCKER_BUILD || process.env.CI || process.argv.includes('--optional')) {
  console.log('\n⚠️  Environnement de build détecté - continuant sans synchronisation API');
  process.exit(0);
}
```

### 3. Updated `package.json`

Added fallback in prebuild script:

```json
"prebuild": "node scripts/sync-openapi.js || echo 'Skipping API sync (backend not available)'"
```

Also added new scripts:
- `build:docker` - Explicit Docker build command
- `sync-api:optional` - Optional sync that never fails

---

## How It Works

### Docker Build (Backend Not Available)
1. Docker sets `DOCKER_BUILD=1` environment variable
2. `npm run build` executes
3. `prebuild` runs sync-openapi script
4. Script detects Docker environment
5. **Exits with code 0** (success) - build continues ✅

### Local Development (Backend Available)
1. No `DOCKER_BUILD` variable set
2. `npm run build` executes
3. `prebuild` runs sync-openapi script
4. Script connects to backend
5. **Syncs successfully** ✅

### Local Development (Backend Unavailable)
1. No `DOCKER_BUILD` variable set
2. `npm run build` executes
3. `prebuild` runs sync-openapi script
4. Script can't connect to backend
5. Fallback: `|| echo 'Skipping...'` ensures build continues ✅

---

## Testing

### Test Docker Build Locally

```bash
# Windows
scripts\build-docker-local.bat

# Linux/Mac
./scripts/build-docker-local.sh
```

Should now complete without errors!

### Test Local Build

```bash
npm run build
```

Will attempt sync, but won't fail if backend is unavailable.

---

## Benefits

✅ **Docker builds work** without backend  
✅ **CI/CD pipelines work** without backend  
✅ **Local development** still syncs when backend is available  
✅ **No breaking changes** to existing workflows  
✅ **Clear logging** shows when sync is skipped  

---

## Optional: Manual API Sync

If you want to manually sync the API schema:

```bash
# Sync from default URL (localhost:8000)
npm run sync-api

# Sync from custom URL
node scripts/sync-openapi.js --url https://your-backend-url/openapi.json

# Optional sync (never fails)
npm run sync-api:optional
```

---

## When to Sync API Schema

You should run `npm run sync-api` when:

1. **Backend API changes** - New endpoints, updated schemas
2. **Before committing** - Ensure types are up to date
3. **After pulling changes** - If backend was updated
4. **During development** - When testing API integrations

**Not needed for:**
- Docker builds (handled automatically)
- CI/CD deployments (skipped automatically)
- When backend isn't running

---

## Files Modified

1. `Dockerfile` - Added `ENV DOCKER_BUILD=1`
2. `scripts/sync-openapi.js` - Added Docker/CI detection
3. `package.json` - Added fallback and new scripts

---

**Status**: ✅ Fixed - Docker builds now succeed!
