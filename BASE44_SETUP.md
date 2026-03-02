# 🚀 Base44 Storage Setup Guide

## What You Need

To connect your Istanbul Coastline Atlas to real Base44 storage, you need:

1. **Base44 App ID** - Your application identifier from Base44
2. **(Optional) Auth Token** - For authenticated requests

---

## Step-by-Step Setup

### 1. Create a Base44 Account & App

1. Go to **https://base44.app**
2. Sign up or log in
3. Create a new app or select an existing one
4. Copy your **App ID** from the dashboard

### 2. Define Entities in Base44 Dashboard

Create these entities in your Base44 app:

#### **contributions** entity:
```json
{
  "contributionId": "string",
  "type": "string",
  "title": "string",
  "description": "string",
  "contributor_name": "string",
  "contributor_email": "string",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "media_url": "string",
  "thumbnail_url": "string",
  "status": "string",
  "created_date": "date",
  "approved_date": "date"
}
```

#### **drawings** entity:
```json
{
  "drawingId": "string",
  "title": "string",
  "description": "string",
  "contributor_name": "string",
  "coordinates": [
    {
      "lat": "number",
      "lng": "number"
    }
  ],
  "style": {
    "color": "string",
    "weight": "number",
    "opacity": "number"
  },
  "status": "string",
  "created_date": "date",
  "approved_date": "date"
}
```

#### **textboxes** entity:
```json
{
  "textBoxId": "string",
  "content": "string",
  "contributor_name": "string",
  "coords": {
    "lat": "number",
    "lng": "number"
  },
  "style": {
    "fontSize": "string",
    "color": "string",
    "backgroundColor": "string"
  },
  "status": "string",
  "created_date": "date",
  "approved_date": "date"
}
```

### 3. Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your App ID:**
   ```env
   VITE_BASE44_APP_ID=68bc3b1e3be9cd0c4b27e368
   VITE_BASE44_SERVER_URL=https://base44.app
   ```

3. **(Optional) Add token if using authentication:**
   ```env
   VITE_BASE44_TOKEN=your_token_here
   ```

### 4. Restart Development Server

```bash
npm run dev
```

### 5. Verify Connection

1. Open browser console (F12)
2. Look for:
   ```
   ✅ Base44 SDK initialized
      App ID: your-app-id
      Server: https://base44.app
      Auth: No token (public access)
   ```

---

## Testing the Integration

### Test 1: Submit a Contribution
1. Click the blue **MapPin** icon
2. Fill in the form
3. Select a location on the map
4. Click Submit
5. Check Base44 dashboard - new entry should appear!

### Test 2: Create a Drawing
1. Click the green **Edit3** icon
2. Draw on the map
3. Check Base44 dashboard - drawing should be saved!

### Entity Schemas

### Entities Defined in Code

All Base44 entities are **defined in the code** (`src/api/entities.js`). When you deploy to Base44, these entities will be automatically created:

#### 1. **contributions**
- User-submitted coastal observations
- Fields: contributionId, title, description, category, location, media, status, etc.
- Sequential IDs: CONT-001, CONT-002, ...

#### 2. **drawings**
- User-drawn lines and paths on the map
- Fields: drawingId, coordinates, bounds, length_meters, category, status, etc.
- Sequential IDs: DRW-001, DRW-002, ...

#### 3. **textboxes**
- Text annotations placed on the map
- Fields: textBoxId, title, content, coords, style, status, etc.
- Sequential IDs: TXT-001, TXT-002, ...

#### 4. **workshop_media** (Future)
- Media files from workshops and events
- Fields: mediaId, title, media_url, workshop_date, tags, etc.
- Sequential IDs: MED-001, MED-002, ...

### How It Works

1. **Schemas are defined** in `src/api/entities.js` with full documentation
2. **Base44 SDK** automatically accesses these entities
3. **On deployment**, Base44 creates the entities automatically
4. **No manual setup** required in the Base44 dashboard!

### View Entity Schemas

To see the complete schema definitions:

```bash
cat src/api/entities.js
```

Each schema includes:
- Field names and types
- Descriptions and constraints
- Default values
- Validation rules

### Local Development

Entities work immediately in local development:
- Base44 SDK handles entity access
- Mock mode fallback if not configured
- Data stored in Base44's database

### Deployment

When you deploy to Base44:
1. Base44 reads entity schemas from code
2. Automatically creates entities in database
3. Sets up indexes for performance
4. Configures permissions

**No manual entity creation needed!** 

---

### Test 3: Add a TextBox
1. Click the cyan **MessageSquare** icon
2. Add text and select location
3. Click Save
4. Check Base44 dashboard - textbox should be saved!

### Test 4: Admin Panel
1. Click the red **Shield** icon
2. Admin panel opens
3. You should see all items from Base44 database
4. Try approving/rejecting/deleting items

---

## Troubleshooting

### ❌ "Base44 App ID not found. Using mock mode."

**Solution:** You haven't created the `.env` file yet.
```bash
cp .env.example .env
# Edit .env and add your App ID
npm run dev
```

### ❌ "Entity not found" error

**Solution:** The entity doesn't exist in your Base44 app.
1. Go to Base44 dashboard
2. Create the entities (contributions, drawings, textboxes)
3. Make sure entity names match exactly

### ❌ Data not appearing in Admin Panel

**Solution:** 
1. Check browser console for errors
2. Verify App ID is correct
3. Check if entities are created in Base44
4. Try creating a test item manually in Base44 dashboard

### ❌ "Unauthorized" or "403" errors

**Solution:** 
1. Check if your app requires authentication
2. Add `VITE_BASE44_TOKEN` to `.env`
3. Or configure public access in Base44 dashboard

---

## What Happens Now?

### ✅ With Base44 Connected:
- All contributions saved to Base44 database
- All drawings saved to Base44 database
- All textboxes saved to Base44 database
- Data persists across page refreshes
- Admin can manage all items
- Multiple users can access same data
- Sequential IDs (CONT-001, DRW-002, etc.)

### ⚠️ Without Base44 (Mock Mode):
- Data saved to browser memory only
- Data lost on page refresh
- Still fully functional for testing
- No real database storage

---

## Production Deployment

When deploying to production (Netlify, Vercel, etc.):

1. Add environment variables in your hosting platform:
   ```
   VITE_BASE44_APP_ID=your_app_id
   VITE_BASE44_SERVER_URL=https://base44.app
   VITE_BASE44_TOKEN=your_token (if needed)
   ```

2. Rebuild and deploy

3. Verify connection in production console

---

## Need Help?

- **Base44 Documentation:** https://docs.base44.com
- **Base44 Dashboard:** https://base44.app
- **Base44 SDK:** https://github.com/base44/sdk

---

## Summary

**Current Status:** Code is ready, just needs Base44 App ID!

**To activate:**
1. Get App ID from https://base44.app ✅
2. Create entities in dashboard ✅
3. Add App ID to `.env` file ✅
4. Restart server ✅
5. Done! 🎉
