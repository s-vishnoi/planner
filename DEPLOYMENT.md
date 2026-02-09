# 🚀 Quick Deployment Guide

This app is ready to deploy! Choose one of these super simple options:

---

## Option 1: Vercel (Recommended - 2 minutes)

### Steps:

**If you've never used Vercel before:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel** (this opens your browser)
   ```bash
   vercel login
   ```
   - Click the link or press Enter to open browser
   - Confirm the login
   - Wait for "Congratulations! You are now logged in."

3. **Deploy from this folder**
   ```bash
   cd /path/to/planner
   vercel
   ```

4. **Follow the prompts:**
   - "Set up and deploy?"  → Press **Enter** (Yes)
   - "Which scope?"        → Press **Enter** (your account)
   - "Link to existing?"   → Press **Enter** (No)
   - "What's your name?"   → Press **Enter** (accepts default: `planner`)
   - "In which directory?" → Press **Enter** (current directory)
   - "Want to override?"   → Press **Enter** (No)

5. **Done!** You'll get TWO URLs:
   - Preview: `https://planner-abc123.vercel.app` (unique deploy)
   - Production: `https://planner-yourname.vercel.app` (stable URL)

6. **Share the Production URL with your friends!**

---

### Auto-Deploy on Git Push (Optional)

After first deploy, go to: https://vercel.com/dashboard

1. Find your `planner` project
2. Go to **Settings → Git**
3. Click **Connect Git Repository**
4. Select `s-vishnoi/planner`
5. Done! Now every push to `main` auto-deploys

---

### Troubleshooting Vercel Deploy

**"No existing credentials found"**
- Run `vercel login` first
- Make sure you complete the browser authentication

**"Command not found: vercel"**
- Make sure npm is installed: `npm --version`
- Try: `npx vercel` instead (runs without global install)

**Browser won't open for login**
- Copy the URL shown in terminal
- Paste it into your browser manually

**It's asking too many questions**
- Just press Enter for all of them - the defaults work!

---

## Option 2: Netlify Drop (Even Easier!)

### Steps:
1. Go to: https://app.netlify.com/drop

2. **Drag and drop this entire folder** into the browser

3. **Done!** You get an instant URL

---

## Option 3: GitHub Pages (If you want it on GitHub)

### Steps:
1. **Create a GitHub repo** and push your code

2. **Go to repo Settings → Pages**

3. **Set Source to "main" branch**

4. **Your site will be at:** `https://yourusername.github.io/planner`

---

## Why these options?

- ✅ **Free forever** (for your use case)
- ✅ **No backend needed** - your Supabase handles everything
- ✅ **Auto HTTPS** - secure by default
- ✅ **Fast worldwide** - CDN included
- ✅ **Zero configuration** - works immediately

---

## What NOT to do:

❌ Don't add Flask/Python - you don't need a backend
❌ Don't add a "main file" - this is pure HTML/JS
❌ Don't overthink it - your code is deployment-ready!

---

## After Deploying: Update Supabase

Once deployed, you need to tell Supabase about your new URL:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication → URL Configuration**
4. Update **Site URL** to your Vercel URL: `https://planner-yourname.vercel.app`
5. Add to **Redirect URLs**: `https://planner-yourname.vercel.app/**`

This makes email verification work on your deployed site!

---

## Troubleshooting:

**Q: Do I need to change anything in my code?**
A: Nope! It works as-is.

**Q: What about my Supabase credentials?**
A: They're already in `script.js` and safe to commit (they're meant to be public for frontend apps).

**Q: Can I get a custom domain?**
A: Yes! All three platforms support custom domains in their settings.

**Q: Email verification isn't working**
A: Make sure you updated the Supabase Site URL (see "After Deploying" above)

---

## Quick Summary:

```bash
# Literally just run this:
npm install -g vercel
vercel
```

That's it. Share the URL with your friends and you're done! 🎉
