# Fuel IQ 🔥

**Eat Smarter. Live Sharper.**

An intelligent nutrition platform that turns food and health data into personalized performance guidance. Built with React and Node.js, powered by AI.

## 🧠 Mission

To empower individuals with intelligent, actionable insights into how food, biomarkers, and lifestyle affect their energy, health, and longevity.

## 🎯 Positioning

Fuel IQ is the intelligent nutrition platform that turns food and health data into personalized performance guidance. It's not just tracking—it's transformation.

## ✨ Core Features

- **Smart Food Tracking**: AI-powered nutrition analysis with 40+ nutrients
- **Intelligent Food Lookup**: Advanced food search and nutrition estimation
- **Personal Food Database**: Your own searchable food history with auto-suggestions  
- **Supplement Management**: Track vitamins, supplements, and medications
- **Bloodwork Analysis**: Upload lab results for AI-powered health correlations
- **Performance Analytics**: Personalized insights connecting diet to health metrics
- **Mobile-First Design**: Optimized for iPhone and Android devices

## 🚀 Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI with custom Fuel IQ design system
- React Router for navigation
- Inter font for modern typography

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- **OpenAI GPT-4o-mini** for intelligent analysis
- JWT authentication

**Design System:**
- Primary: Deep electric blue (#0066cc) - trust + tech
- Accent: Neon green (#00e676) - energy + life  
- Neutral: Slate gray (#2e2e2e) and off-white (#f8f9fa)

## 📱 Installation

```bash
git clone https://github.com/Babylon77/fuel-iq.git
cd fuel-iq

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/fuel-iq

# JWT Secret
JWT_SECRET=your-jwt-secret-here

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# App Settings
NODE_ENV=development
PORT=5000
```

## 🏃‍♂️ Running the Application

**Development mode (both frontend and backend):**
```bash
npm run dev
```

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

Visit `http://localhost:3000` to access Fuel IQ.

## 📊 Getting Started

1. **Create Account**: Sign up with your email and basic info
2. **Log Your First Meal**: Use our AI-powered food search
3. **Upload Bloodwork**: Add lab results for health correlations
4. **Track Progress**: Monitor your nutrition and health metrics
5. **Get Insights**: Receive personalized AI analysis and recommendations

## 🔮 Key Features

- **Performance Analytics**: 3-7 days of food logs recommended for best insights
- **Smart Recommendations**: AI-powered suggestions based on your unique data
- **Health Correlations**: Connect nutrition patterns to biomarker changes
- **Mobile Optimized**: Works seamlessly on all devices

## 📂 Project Structure

```
fuel-iq/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application pages
│   │   ├── styles/     # Fuel IQ design system
│   │   └── types/      # TypeScript type definitions
├── backend/           # Node.js backend API
│   ├── models/        # MongoDB models
│   ├── routes/        # API endpoints
│   └── middleware/    # Custom middleware
└── docs/             # Documentation and planning
```

## 🎨 Design Philosophy

**Sharp, confident, friendly** - Like a performance coach meets data scientist.

- **Smart**: Intelligent insights, not just data
- **Modern**: Clean, tech-forward interface  
- **Performance-oriented**: Focus on actionable outcomes
- **Proactive**: Anticipate user needs and goals

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📈 Features in Development

- Multi-LLM analysis for second opinions
- Advanced sleep and lifestyle tracking
- Photo + voice food analysis
- Barcode scanning for packaged foods
- Enhanced bloodwork PDF extraction

## 🙏 Acknowledgments

- OpenAI for AI-powered nutrition analysis
- Material-UI for component library
- The performance nutrition community for evidence-based insights 