# Monthly Habit Tracker

A simple, beautiful habit tracking app with optional cloud sync via Supabase.

---

## 📋 What You Need

- A web browser
- Python (for local development)
- A Supabase account (free - if you want cloud sync)

---

## 🏃 Running Locally

### 1. Start a local server

From this folder, run:

```bash
python3 -m http.server 3000
```

### 2. Open in browser

Go to: **http://localhost:3000**

⚠️ **Important**: Don't just open `index.html` by double-clicking! You need the server running for:
- Supabase authentication to work
- Email verification redirects to work
- Proper CORS handling

---

## ☁️ Setting Up Supabase (Optional - for cloud sync)

If you want users to sync data across devices, you need to configure Supabase properly.

### 1. Go to Supabase Dashboard

https://supabase.com/dashboard

### 2. Select your project

The project URL in `script.js` is: `https://bkmbbtndwfaqwktzmewe.supabase.co`

### 3. Configure Authentication URLs

Go to: **Authentication → URL Configuration**

#### Site URL:
- **Local development**: `http://localhost:3000`
- **After deploying**: `https://your-vercel-url.vercel.app`

#### Redirect URLs:
Add both (one per line):
```
http://localhost:3000/**
https://your-vercel-url.vercel.app/**
```

### 4. Create the database table

Go to: **SQL Editor** and run:

```sql
-- Create the habit_data table
CREATE TABLE habit_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX habit_data_user_id_idx ON habit_data(user_id);

-- Enable Row Level Security
ALTER TABLE habit_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can read own data"
  ON habit_data FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON habit_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON habit_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own data
CREATE POLICY "Users can delete own data"
  ON habit_data FOR DELETE
  USING (auth.uid() = user_id);
```

This ensures:
- ✅ Each user can only see/edit their own data
- ✅ No one can access another user's habits
- ✅ Data is properly isolated

---

## 🔍 How It Works

### Data Storage

**localStorage (Browser)**
- Stores ALL data locally in your browser
- Works completely offline
- No account needed
- Private to your device

**Supabase (Cloud - Optional)**
- Only syncs when you sign in (click ☁️ button)
- Syncs every 30 seconds when signed in
- Enables multi-device access
- Uses smart conflict resolution (newer timestamp wins)

### Flow

1. **Without signing in**:
   - Everything saved to localStorage only
   - Works perfectly, just no cross-device sync

2. **After signing in**:
   - Data syncs to Supabase every 30 seconds
   - When you open on another device → pulls latest from cloud
   - If offline → queues sync for later

---

## 🐛 Troubleshooting

### "Email verification redirects to localhost:3000 but nothing loads"

**Fix**: Make sure you're running the local server:
```bash
python3 -m http.server 3000
```

### "Supabase auth isn't working"

**Check**:
1. Is your local server running?
2. Are you accessing via `http://localhost:3000` (not `file://...`)?
3. Did you set the Site URL in Supabase dashboard?

### "I can see other users' data"

**Fix**: You need to set up Row Level Security (RLS) policies - see Supabase setup above.

### "Data not syncing"

**Check**:
1. Are you signed in? (☁️ button should be blue)
2. Open browser console (F12) - any errors?
3. Check Supabase table has data: Dashboard → Table Editor → habit_data

---

## 🚀 Ready to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for how to get this online in 2 minutes!

---

## 📁 File Structure

```
planner/
├── index.html          # Main HTML structure
├── style.css          # All the styling
├── script.js          # App logic + Supabase integration
├── README.md          # You are here
└── DEPLOYMENT.md      # How to deploy online
```

---

## ⚙️ Configuration

### Changing Supabase Project

Edit `script.js` lines 67-68:

```javascript
const SUPABASE_URL='https://your-project.supabase.co'
const SUPABASE_ANON_KEY='your-anon-key-here'
```

Get these from: **Supabase Dashboard → Settings → API**

---

## 🤝 Sharing with Friends

### Option 1: Everyone uses your Supabase (easiest)
- Deploy to Vercel (see DEPLOYMENT.md)
- Share the URL
- Each friend creates their own account
- ⚠️ You pay for everyone's storage (but Supabase free tier is generous)

### Option 2: Each person deploys their own (most private)
- Each friend clones this repo
- Each creates their own Supabase project
- Each deploys to Vercel with their own Supabase keys
- Everyone has complete privacy + control

---

## 💡 Tips

- **Backup your data**: If using only localStorage, export your data regularly (it's stored in browser storage)
- **Use cloud sync**: Sign in before switching devices
- **Email verification**: Required for cloud sync to work
- **Privacy**: With RLS policies enabled, your data is completely private

---

## ❓ Questions?

- Local development not working? Check you're using `http://localhost:3000`
- Deployment questions? See DEPLOYMENT.md
- Supabase issues? Check the SQL policies are set up correctly
