# Render Environment Variables Configuration

When deploying your backend to Render, set these environment variables in the Render dashboard:

## Required Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=5112

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/exam

# JWT Secrets (IMPORTANT: Generate new secure secrets for production!)
JWT_SECRET=your-32-character-jwt-secret-here
JWT_REFRESH_SECRET=your-32-character-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration (Critical!)
CORS_ORIGIN=https://musical-alpaca-00c8b2.netlify.app

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## How to Set Environment Variables in Render:

1. Go to your Render dashboard
2. Select your web service (backend)
3. Click on "Environment" in the left sidebar
4. Click "Add Environment Variable"
5. Add each variable listed above

## Important Notes:

### 🔐 Security:
- **Generate new JWT secrets** for production (at least 32 characters)
- **Never commit** your `.env` file to GitHub
- The CORS_ORIGIN is now set to your Netlify URL: `https://musical-alpaca-00c8b2.netlify.app`

### 🔄 After Setting Environment Variables:
1. Render will automatically redeploy your backend
2. Wait for the deployment to complete
3. Test your API endpoints
4. Your frontend should now be able to communicate with the backend

### ✅ CORS Configuration:
The backend is now configured to:
- ✅ Only accept requests from your Netlify frontend
- ✅ Support credentials and authentication
- ✅ Allow necessary HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- ✅ Handle preflight OPTIONS requests properly

### 🚨 If Render Blocks Requests:
If you still see CORS errors:
1. Check Render logs for any errors
2. Verify the CORS_ORIGIN environment variable is set correctly
3. Make sure your frontend is deployed to the exact URL in CORS_ORIGIN
4. Test the API directly using Postman or curl to isolate CORS issues