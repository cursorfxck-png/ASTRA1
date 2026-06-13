# Quick Start - Supabase Integration

## Current Status
✅ **App is working with LOCAL files** (default mode)
⏳ Supabase integration is ready but **disabled** until you complete setup

## To Enable Supabase (Optional)

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js
```

### Step 2: Create Bucket in Supabase

1. Go to: https://supabase.com/dashboard/project/bfgynclddehatuwfxehr/storage
2. Click **"New bucket"**
3. Set:
   - Name: `astra-bucket`
   - ✅ Check **"Public bucket"**
4. Click **"Create bucket"**

### Step 3: Set Bucket Policies

1. Go to: https://supabase.com/dashboard/project/bfgynclddehatuwfxehr/storage/policies
2. Click **SQL Editor** in the sidebar
3. Copy and paste ALL content from `scripts/create-bucket.sql`
4. Click **Run**

### Step 4: Upload Files to Supabase

```bash
npm run upload-to-supabase
```

This uploads:
- `site-content.json` 
- All files from `public/uploads/`

### Step 5: Enable Supabase in Code

Open these files and change `USE_SUPABASE = false` to `USE_SUPABASE = true`:

1. **src/lib/content.ts** (line 8)
2. **src/app/api/upload/route.ts** (line 13)

### Step 6: Restart Dev Server

```bash
npm run dev
```

## Verification

Test that files are accessible:
```
https://bfgynclddehatuwfxehr.supabase.co/storage/v1/object/public/astra-bucket/site-content.json
```

## Benefits of Using Supabase

✅ **Global CDN** - Fast file delivery worldwide
✅ **No local storage** - Files stored in cloud
✅ **Scalable** - No file size/count limits
✅ **Accessible anywhere** - Access from any device
✅ **Automatic backups** - Supabase handles backups

## If You Don't Want Supabase

**No problem!** The app works perfectly with local files:
- Files stored in `public/uploads/`
- Content in `src/data/site-content.json`
- No cloud dependencies
- Works offline

You can enable Supabase later when needed.
