# Nutrition App MVP 🥗

A comprehensive nutrition tracking and analysis application with AI-powered insights, built with React and Node.js.

## 🚀 Features

### Core Functionality
- **Food Logging**: Track meals with detailed nutritional information (40+ nutrients)
- **AI-Powered Food Lookup**: Intelligent food search and nutrition estimation
- **Weight Goal Management**: Set and track weight loss/gain goals with timeline
- **Personalized Calorie Targets**: BMR-based calculations with activity level adjustments
- **Health Metrics**: BMI tracking and comprehensive health insights

### AI Analysis
- **Nutrition Analysis**: Detailed dietary pattern analysis with insights and recommendations
- **Bloodwork Analysis**: Lab result interpretation and health recommendations
- **Correlation Analysis**: Relationship analysis between diet and health markers
- **Goal-Oriented Recommendations**: AI factors in weight goals and activity levels

### Health Tracking
- **Bloodwork Management**: Upload and track lab results over time
- **Profile Management**: Comprehensive health profile with goals and restrictions
- **Dashboard**: Real-time nutrition summary with progress tracking

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for modern, responsive design
- **React Hook Form** for form management
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **OpenAI API** for intelligent analysis
- **Bcrypt** for password security

### AI Integration
- **OpenAI GPT-4o-mini** for nutrition analysis
- **Custom prompts** for health-focused recommendations
- **Conservative BMR calculations** for sustainable weight management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Babylon77/Nutrition-app.git
cd Nutrition-app
```

### 2. Install Dependencies
```bash
# Install root dependencies (for concurrent running)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/nutrition-app
JWT_SECRET=your-jwt-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### 4. Start the Application

From the root directory:
```bash
# Start both backend and frontend
npm start

# Or start separately:
# Backend: cd backend && npm run dev
# Frontend: cd frontend && npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## 📖 Usage Guide

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Complete Profile**: Add personal information, weight goals, and activity level
3. **Log Food**: Start tracking your meals using the AI-powered food lookup
4. **Set Goals**: Define weight targets with realistic timeframes
5. **Track Progress**: Monitor your nutrition on the dashboard
6. **Get Insights**: Generate AI analysis for personalized recommendations

### Weight Goal System
- Set current weight → target weight → timeframe (weeks)
- System calculates daily calorie targets using conservative BMR formulas
- Activity level multipliers: Sedentary (1.15) to Extra Active (1.75)
- Safety caps: Maximum 2 lbs/week weight loss, minimum calories (1200-1500)

### AI Analysis
- **Nutrition Analysis**: 3-7 days of food logs recommended for best insights
- **Activity Integration**: AI factors in your stated activity level
- **Goal Alignment**: Recommendations align with weight loss/gain objectives
- **Conservative Approach**: Sustainable 1-2 lbs/week recommendations

## 🏗️ Architecture

```
Nutrition-app/
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic (AI, etc.)
│   │   ├── middleware/    # Auth, validation
│   │   └── utils/         # Helpers
│   └── package.json
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Helper functions
│   └── package.json
└── package.json          # Root scripts
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🧪 MVP Scope

This MVP includes:
- ✅ Complete user authentication system
- ✅ Comprehensive food logging with 40+ nutrients
- ✅ AI-powered food lookup and nutrition estimation
- ✅ Weight goal management with personalized calorie targets
- ✅ Dashboard with real-time nutrition tracking
- ✅ AI analysis with activity level integration
- ✅ Bloodwork tracking and analysis
- ✅ Profile management with health metrics
- ✅ BMI calculation and health insights

## 🔄 Development Status

**Current Version**: MVP v1.0.0

### Recent Updates
- Enhanced AI prompts to factor in activity levels
- Conservative calorie calculation system
- Weight goal integration with AI recommendations
- Improved nutrition tracking with comprehensive micronutrients
- Dashboard calorie targets aligned with weight goals

## 🤝 Contributing

This is an MVP release. For contributions:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check the console logs for debugging information
- Ensure OpenAI API key is properly configured
- Verify MongoDB connection

## 🏆 Acknowledgments

- OpenAI for AI-powered nutrition analysis
- Material-UI for the component library
- MongoDB for flexible data storage
- The nutrition science community for BMR formulas and guidelines

## 🚀 Deployment

This app is configured for easy deployment on **Render**. See the detailed [Deployment Guide](./DEPLOYMENT.md) for step-by-step instructions.

### Quick Deploy to Render

1. Fork this repository
2. Connect to Render
3. Set environment variables
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

## 📱 Development

---

**Note**: This is an MVP (Minimum Viable Product) for user testing and feedback. Features and functionality will continue to evolve based on user needs and feedback. 