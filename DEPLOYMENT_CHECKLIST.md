# Backend Deployment Checklist for Render (Direct Node.js - NO Docker)

## ⚠️ IMPORTANT: Direct Node.js Deployment Only
- **DO NOT** select "Docker" when creating the service
- **DO NOT** use Docker-related files (Dockerfile, docker-compose.yml)
- Use "Web Service" with Node.js runtime only
- If Render asks for Docker, you've selected the wrong service type

## Pre-Deployment Steps
- [ ] Run deployment test: `./test-deployment.sh`
- [ ] Ensure all code is committed and pushed to GitHub
- [ ] Update MongoDB URI in production environment
- [ ] Generate secure JWT secrets (minimum 32 characters)
- [ ] Update CORS_ORIGIN with your Netlify frontend URL
- [ ] Test application locally: `npm start`

## Render Deployment Steps (Direct Node.js - NO Docker)

### 1. Create Render Account
- Go to https://render.com
- Sign up/Sign in with GitHub

### 2. Create New Web Service
- Click "New" → "Web Service" (**NOT "Docker"**)
- Connect your GitHub repository
- **Important**: Set **Root Directory** to `backend/` (since your backend is in a subfolder)

### 3. Configure Service (Manual Setup)
- **Name**: kyptronix-backend (or your preferred name)
- **Environment**: Node
- **Region**: Select closest to your users
- **Branch**: main
- **Root Directory**: `backend/` (specify the backend subfolder)
- **Runtime**: Node.js (should auto-detect)

### 4. Build & Start Commands
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 5. Set Environment Variables
Add these environment variables in Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/database
JWT_SECRET=your-32-character-jwt-secret-here
JWT_REFRESH_SECRET=your-32-character-refresh-secret-here
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

### 6. Advanced Settings (Optional)
- **Health Check Path**: `/health`
- **Auto-Deploy**: Enable for automatic deployments on push

### 7. Deploy
- Click "Create Web Service"
- Wait for deployment to complete (usually 2-5 minutes)
- Note the service URL (e.g., https://kyptronix-backend.onrender.com)

### 6. Update Frontend
- Update your frontend's API base URL to point to the Render service
- For Netlify: Update `netlify.toml` and `public/_redirects`
- Environment variable: `VITE_API_BASE_URL=https://kyptronix-backend.onrender.com`

### 7. Test Deployment
- Visit your Netlify frontend
- Test API calls
- Check browser console for CORS errors
- Verify database connections

## Troubleshooting

### Common Issues:
1. **Port Issues**: Render assigns random ports, but our app uses PORT env var
2. **CORS Errors**: Ensure CORS_ORIGIN matches your frontend URL exactly
3. **MongoDB Connection**: Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
4. **JWT Secrets**: Must be at least 32 characters for security

### Logs:
- Check Render service logs for errors
- Use `console.log` for debugging during deployment

### Rollback:
- If deployment fails, check previous deployments in Render dashboard
- Roll back to working version if needed

## Post-Deployment
- [ ] Update frontend with production API URL
- [ ] Test all features end-to-end
- [ ] Set up monitoring/alerts in Render
- [ ] Configure automatic deployments for future updates