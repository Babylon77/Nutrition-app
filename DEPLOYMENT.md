# Render Deployment Guide 🚀

This guide walks you through deploying your Nutrition App to Render.

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a cloud MongoDB database
4. **OpenAI API Key**: Get your API key from OpenAI

## Deployment Steps

### 1. Connect GitHub to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub account and select your nutrition-app repository

### 2. Configure the Web Service

Use these settings:

- **Name**: `nutrition-app` (or your preferred name)
- **Runtime**: `Node`
- **Build Command**: `npm run build:all`
- **Start Command**: `npm run start:production`
- **Plan**: `Free` (for testing) or `Starter` (for production)

### 3. Set Environment Variables

In the Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nutrition-app
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 4. Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new project and cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Get your connection string and use it for `MONGODB_URI`

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Your app will be available at `https://your-app-name.onrender.com`

## Important Notes

- **Free Plan Limitations**: The free plan spins down after 15 minutes of inactivity
- **Build Time**: First deployment may take 5-10 minutes
- **Health Checks**: Render uses `/api/health` endpoint to monitor your app
- **Logs**: Check the Render dashboard for build and runtime logs

## Environment Variables Details

### Required Variables

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string (minimum 32 characters)
- `OPENAI_API_KEY`: Your OpenAI API key for nutrition analysis

### Optional Variables

- `NODE_ENV`: Set to `production` (automatically set by Render)
- `PORT`: Set to `10000` (Render's default port)

## Troubleshooting

### Build Issues
- Check the build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation passes

### Runtime Issues
- Check the service logs in Render dashboard
- Verify environment variables are set correctly
- Test the health endpoint: `https://your-app.onrender.com/api/health`

### Database Connection Issues
- Verify MongoDB Atlas connection string
- Check that IP whitelist includes 0.0.0.0/0
- Ensure database user has proper permissions

## Post-Deployment Testing

1. Visit your app URL
2. Test user registration
3. Try logging food entries
4. Test AI analysis features
5. Check that profile updates work

Your Nutrition App is now live and ready for user testing! 🎉 