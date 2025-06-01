# Nutrition App - Sprint Roadmap & Implementation Plan

## Sprint Planning Based on FEATURE_PLANNING.md

This roadmap implements the features and priorities already outlined in `FEATURE_PLANNING.md`, organized into logical development sprints.

---

## **DEVELOPMENT GUIDELINES & BEST PRACTICES** 🔧

### **Critical Rules for All Sprints**
1. **🚫 Never Break Existing Functionality** - Always test existing features before and after changes
2. **🔗 Integration Awareness** - Be cognizant of frontend/backend integration with:
   - OpenAI API (cost implications, rate limits, error handling)
   - MongoDB Database (schema changes, data migrations)
   - Existing API endpoints and data flow
3. **📱 Mobile-First Philosophy** - All new features must be mobile-optimized from day one
   - Test on iPhone 12 and Pixel 7 specifically
   - Responsive design patterns throughout
   - Touch-friendly interactions
4. **⚠️ Compilation Error Monitoring** - Always review terminal for:
   - TypeScript compilation errors
   - ESLint warnings
   - React warnings
   - Build failures

### **Development Workflow**
- **Before**: Test existing functionality
- **During**: Monitor terminal for errors continuously
- **After**: Full mobile testing and integration verification

---

## **SPRINT 1: Food System Core Improvements** 
*Priority: HIGH | Duration: 2 weeks | Based on High Priority MVP+ Features*

### **Goals** (from FEATURE_PLANNING.md)
- Fix current MVP food system limitations
- Implement cost-saving bulk entry
- Add personal food database functionality
- Improve mobile experience
- **Add user onboarding and tutorials**

### **User Stories**
1. **As a user, I want to add multiple foods before making API calls to save time and cost**
2. **As a user, I want my previous foods searchable so I don't re-analyze the same items**
3. **As a user, I want to adjust food quantities with automatic macro scaling**
4. **As a new user, I want guidance on how to use the app effectively**

### **Features from FEATURE_PLANNING.md High Priority**
- ✅ **Bulk Food Entry Interface** (COMPLETED)
  - Search personal foods first (instant)
  - Queue unknown foods for batch AI processing
  - 70% cost savings on API calls
- ✅ **Personal Food Database** (COMPLETED)
  - Searchable history with auto-suggest
  - Import from existing food logs
  - Smart personal food recommendations
- ✅ **Quantity Adjustment with Scaling** (COMPLETED)
  - Manual quantity/unit editing with automatic nutrition scaling
  - Quick portion adjustments (½×, 1½×, 2×)
  - Comprehensive scaling for all 30+ nutrients
  - Weight conversion scaling support
- ✅ **Mobile Experience Improvements** (COMPLETED)
  - ✅ Touch-optimized food entry with responsive design
  - ✅ Mobile-first tutorial system  
  - ✅ Responsive Smart Food Entry form layout
  - ✅ Touch-friendly action buttons and controls
  - ✅ Fixed horizontal scrolling issues on all pages (Analysis, Bloodwork, Personal Foods)
  - ✅ Resolved content cropping problems on mobile devices
  - ✅ iPhone 12 specific optimizations (table layouts, typography, spacing)
  - ✅ Pixel 7 compatibility improvements
  - ✅ Mobile-specific CSS media queries for screens <390px
  - ✅ Responsive typography scaling across all components
  - ✅ Fixed duplicate "Daily Nutrition Summary" title in Food Log
  - ✅ Compressed navigation and action elements for mobile screens
- ✅ **User Tutorial/Onboarding System** (COMPLETED - React 19 compatible)
  - Progressive disclosure tutorial
  - Contextual help system
  - First-time user onboarding
  - Feature-specific tutorials (food entry, analytics, bloodwork)

### **Technical Tasks**
- ✅ Implement proportional nutrition scaling for quantity adjustments
- ✅ Improve mobile responsiveness of Smart Food Entry
- ⏳ Redesign micronutrient display for better space efficiency
- ✅ Add comprehensive error handling and loading states
- ✅ Build tutorial system with optional popups for each screen
- ✅ Create guided onboarding flow for new users
- ✅ Add contextual help tooltips throughout the app

### **Success Criteria** (from FEATURE_PLANNING.md)
- ✅ API cost reduction through bulk processing
- ✅ Improved mobile user experience
- ✅ Personal food database fully functional
- ✅ Quantity adjustment with proper macro scaling
- ✅ New users can successfully complete first food log with tutorial guidance
- ✅ Tutorial system is discoverable but not intrusive

## **SPRINT 1 STATUS: ✅ COMPLETED**

**Delivered Features:**
1. **Quantity Adjustment with Scaling** - Users can now edit food quantities with automatic nutrition scaling for all nutrients
2. **Quick Portion Adjustments** - One-click buttons for common serving sizes (½×, 1½×, 2×)
3. **Mobile-Responsive Design** - Smart Food Entry and food cards now stack properly on mobile devices
4. **Touch-Friendly Controls** - Larger touch targets and responsive layouts for mobile users
5. **Enhanced Tutorial System** - React 19 compatible onboarding with contextual help

**Technical Achievements:**
- Comprehensive nutrition scaling algorithm handling 30+ nutrients
- Mobile-first responsive design patterns
- Automatic weight conversion scaling
- Error handling and user feedback systems
- Cross-device mobile compatibility (iPhone 12, Pixel 7, iPad)
- Advanced CSS media queries for device-specific optimization
- Horizontal scroll prevention with proper content flow
- Touch-optimized UI components and interactions

---

## **SPRINT 2: Health Metrics & Supplements Foundation** 
*Priority: HIGH | Duration: 3 weeks | Based on Bloodwork & Supplements Features*

### **Goals**
- Build comprehensive supplements/medicine tracking system
- Implement LLM-powered PDF extraction for bloodwork
- Expand biomarker support with additional hormones
- Add health metrics history tracking and trends
- Enhance Health Metrics UI for better usability

### **User Stories**
1. **As a user, I want to track my daily supplements and medications separately from food**
2. **As a user, I want to upload bloodwork PDFs and have the data extracted automatically**
3. **As a user, I want to track testosterone and other key hormones in my bloodwork**
4. **As a user, I want to see historical trends in my health metrics over time**
5. **As a user, I want an intuitive interface for manual bloodwork entry**

### **Features from FEATURE_PLANNING.md High Priority**
- [ ] **Supplements/Medicine Tracking Page** - Separate section similar to Food Log but for daily supplements, vitamins, medications
  - LLM-powered supplement logging (similar to food entry)
  - Personal supplements database with search/history
  - Dosage tracking and timing
  - Integration with health analysis
- [ ] **LLM-Powered PDF Extraction** - Automated bloodwork data extraction and formatting
  - Upload PDF functionality
  - AI parsing of lab results
  - Automatic biomarker identification and value extraction
  - Error handling and manual correction options
- [ ] **Expanded Biomarker Support** - Add Testosterone and other key hormones
  - Testosterone (Total, Free)
  - DHEA-S, Cortisol
  - Thyroid panel (TSH, T3, T4)
  - Comprehensive hormone tracking
- [ ] **Health Metrics History** - Historical tracking with trend analysis and correlations
  - Timeline view of biomarker changes
  - Trend charts and analysis
  - Correlation identification between diet/supplements and biomarkers
- [ ] **Enhanced Health Metrics UI** - More intuitive manual entry for biomarkers
  - Improved form layouts
  - Better categorization of lab values
  - Quick entry templates for common panels

### **Technical Tasks**
- Design supplements data schema and API endpoints
- Build supplements logging page with LLM integration
- Implement PDF upload and AI extraction system
- Expand bloodwork schema for additional biomarkers
- Create historical tracking and trend visualization
- Improve bloodwork entry UI/UX with better forms
- Add supplement-health correlation analysis

### **Success Criteria**
- Supplements tracking fully functional with LLM assistance
- PDF bloodwork upload and extraction working reliably
- Comprehensive biomarker tracking including hormones
- Historical trends and correlations visible and actionable
- Intuitive manual entry process for health metrics

## **SPRINT 2 STATUS: 🟡 PARTIALLY COMPLETED**

**Delivered Features:**
1. **Quantity Adjustment with Scaling** - Users can now edit food quantities with automatic nutrition scaling for all nutrients
2. **Quick Portion Adjustments** - One-click buttons for common serving sizes (½×, 1½×, 2×)
3. **Mobile-Responsive Design** - Smart Food Entry and food cards now stack properly on mobile devices
4. **Touch-Friendly Controls** - Larger touch targets and responsive layouts for mobile users
5. **Enhanced Tutorial System** - React 19 compatible onboarding with contextual help
6. **Complete Supplements System** - Full supplement tracking with LLM analysis and personal database
7. **LLM-Powered PDF Extraction** - Automated bloodwork data extraction from PDFs
8. **Multi-Test Bloodwork Analysis** - Trend analysis across multiple test results

**Remaining Sprint 2 Tasks (moved to Sprint 3):**
- Complete hormone panel support (Testosterone, DHEA-S, Cortisol)
- Enhanced bloodwork UI with categorized forms and quick entry templates

---

## **SPRINT 2.5: Modern UI/UX Redesign** 
*Priority: HIGH | Duration: 1-2 weeks | Based on Modern Design Patterns*

### **Goals**
- Implement modern, minimalist design inspired by leading nutrition apps
- Create cohesive color scheme and visual hierarchy
- Add bottom navigation like Fitbit/Garmin
- Introduce engaging data visualizations (gas gauges, progress bars)
- Improve overall user experience without losing functionality

### **Design System - New Color Palette**
- **Primary Colors**: 
  - Soft green (#52b265) - Health, growth, nutrition
  - Soft blue (#bcddd4) - Trust, calm, wellness
- **Accent Colors**: 
  - Warm yellow (#f7c51a) - Highlights, calls to action, achievements
- **Background**: 
  - Light grey (#f5f5f5) - Clean, modern base
  - Off-white variants for cards and sections
- **Typography**: 
  - Dark grey (#4f3f3c) - Primary text for optimal readability
  - Lighter greys for secondary text

### **User Stories**
1. **As a user, I want a modern, visually appealing interface that feels professional and trustworthy**
2. **As a user, I want easy thumb-accessible navigation on mobile like popular fitness apps**
3. **As a user, I want visual progress indicators that make my nutrition data engaging and easy to understand**
4. **As a user, I want a clean, minimalist design that doesn't overwhelm me with information**

### **Features Inspired by Dribbble Examples**
- [ ] **Bottom Navigation Bar** - Thumb-friendly navigation like Fitbit/Garmin Connect
  - Dashboard, Food Log, Supplements, Analysis, Profile tabs
  - Floating action button for quick food/supplement entry
  - Active state indicators with primary colors
- [ ] **Data Visualization Components** - Engaging progress indicators
  - Gas gauge for daily calorie progress (empty to full)
  - Horizontal stacked bars for macronutrients (protein, carbs, fat)
  - Circular progress rings for micronutrients
  - Weekly/monthly trend charts with smooth animations
- [ ] **Card-Based Design System** - Modern layout patterns
  - Rounded corner cards with subtle shadows
  - Consistent spacing and typography hierarchy
  - Color-coded categories (food = green, supplements = blue, bloodwork = warm tones)
- [ ] **Minimalist Food Entry** - Streamlined input experience
  - Clean search interface with auto-suggestions
  - Swipe actions for quick operations
  - Visual meal categories with icons
- [ ] **Dashboard Redesign** - Information hierarchy and visual appeal
  - Today's summary cards with key metrics
  - Quick action buttons with yellow accents
  - Progress overview with visual indicators
  - Recent activity feed with clean typography

### **Technical Tasks**
- Create comprehensive design system with CSS variables for colors
- Implement bottom navigation component with React Router integration
- Build reusable visualization components (gauges, progress bars, charts)
- Update all existing components to use new color scheme
- Add smooth animations and micro-interactions
- Optimize for mobile-first responsive design
- Create consistent icon library and imagery

### **Design References from Dribbble**
Based on the nutrition app designs from [Dribbble](https://dribbble.com/tags/nutrition-app):
- **Beefit Healthcare Dashboard** - Clean card layouts and data visualization
- **Sandow AI Fitness & Nutrition** - Modern bottom navigation and progress indicators  
- **Asklepios AI Healthcare** - Minimalist design with effective use of white space
- **CalorieM8 Nutrition App** - Engaging animations and visual progress tracking

### **Success Criteria**
- Cohesive visual design across all pages and components
- Improved mobile usability with bottom navigation
- Engaging data visualizations that make nutrition tracking more enjoyable
- Faster user task completion due to better information hierarchy
- Positive user feedback on visual appeal and usability
- Maintained or improved app performance despite new visual elements

---

### **Post-Sprint 2.5 Stability Fixes & Optimizations (June 2025)** 🛠️
*A series of critical fixes and improvements were implemented to ensure application stability on Render and resolve data integrity issues that arose during and after Sprint 2.5 deployment.*

- **Render Deployment Stability:**
  - **Session Management**: Implemented `connect-mongo` for persistent MongoDB session storage, resolving `MemoryStore` warnings and ensuring sessions persist across deployments.
  - **Food Queue Robustness**: Addressed a race condition in food queue processing. Initially by adding `req.session.save()`, then by refactoring to a stateless approach where the frontend sends the complete queue to the backend for processing.
  - **Build Error Resolution**: Fixed a TypeScript fallthrough error (`TS7029`) in `backend/src/routes/food.ts` that was causing Render builds to fail.
  - **Rate Limiting Adjustments**: Temporarily increased backend rate limits and frontend debounce times to mitigate "Too many requests" errors on Render. Implemented client-side caching for personal food search as a long-term optimization.

- **Data Integrity & Consistency (Local & Render):**
  - **Date Handling for Food Logs**: Standardized on `YYYY-MM-DD` string format for `FoodLog.date` across storage and querying. This fixed issues with calorie meter discrepancies and food logs not appearing for the correct date due to timezone or `Date` object vs. string mismatches.
  - **Backend `targetDate` Error**: Corrected a TypeScript error in `backend/src/routes/food.ts` where `targetDate` was undefined (after date string refactor), ensuring the backend dev server could start and responses were formatted correctly.

---

## **SPRINT 3: Advanced Analytics & AI Features**
*Priority: HIGH | Duration: 2 weeks | Based on Advanced Analytics Features*

### **Goals**
- Implement multi-LLM analysis system for second opinions
- Add AI recommendation action system
- Integrate supplements data into comprehensive health analysis
- Build cross-correlation analytics between diet, supplements, and biomarkers

### **User Stories**
1. **As a user, I want second opinions on my health analysis from different AI models**
2. **As a user, I want to save and track AI recommendations as actionable items**
3. **As a user, I want my supplements included in my overall health analysis**
4. **As a user, I want to see correlations between my diet, supplements, and lab results**

### **Features from FEATURE_PLANNING.md High Priority**
- [ ] **Multi-LLM Second Opinion** - Cross-validate analysis with Gemini vs ChatGPT
  - Gemini Pro integration for second opinion analysis
  - Side-by-side comparison of AI insights
  - User preference for primary vs secondary analysis model
- [ ] **AI Recommendation Actions** - Save/highlight LLM suggestions into master checklist
  - Actionable recommendation extraction
  - Personal health action items tracking
  - Progress tracking on AI suggestions
- [ ] **Comprehensive Health Integration** - Include supplements/medications in LLM analysis
  - Combined diet + supplements analysis
  - Drug-nutrient interaction warnings
  - Holistic health optimization recommendations
- [ ] **Advanced Correlation Analytics** - Cross-analysis between diet, supplements, and biomarkers
  - Statistical correlation identification
  - Trend analysis across all health data
  - Predictive insights based on historical patterns

### **Technical Tasks**
- Integrate Gemini Pro API for second opinion analysis
- Build recommendation action tracking system
- Create comprehensive data aggregation for multi-source analysis
- Implement correlation algorithms across diet/supplements/biomarkers
- Design AI comparison interface

### **Success Criteria**
- Multi-LLM analysis providing valuable second opinions
- Users can save and track AI recommendations effectively
- Supplements data integrated into overall health analysis
- Meaningful correlations identified and presented to users

---

## **SPRINT 4: Lifestyle Integration**
*Priority: HIGH | Duration: 2 weeks | Based on Sleep & Lifestyle Features*

### **Goals**
- Add sleep and lifestyle factor tracking
- Implement comprehensive health correlation
- Prepare for device integrations

### **Features from FEATURE_PLANNING.md High Priority**
- [ ] **Sleep Integration** - Connect sleep data for comprehensive health correlation
- [ ] **Lifestyle Factor Tracking** - Manual alcohol consumption, smoking, substance tracking
- [ ] **Sleep Quality Correlations** - Analyze late-night eating, alcohol effects on sleep

### **Technical Tasks**
- Design sleep and lifestyle data schemas
- Build manual entry interfaces for sleep metrics
- Implement correlation analysis between diet, sleep, and lifestyle
- Create lifestyle factor UI

### **Success Criteria**
- Sleep data entry and tracking functional
- Lifestyle factors integrated into health analysis
- Correlations between diet, sleep, and lifestyle visible

---

## **SPRINT 5: Advanced Input Methods**
*Priority: MEDIUM | Duration: 3 weeks | Based on V2 Features*

### **Goals**
- Implement photo + voice food analysis
- Add barcode scanning capability
- Create recipe storage system

### **Features from FEATURE_PLANNING.md Medium Priority**
- [ ] **Photo + Voice Mode** - Camera + voice/text description for complex dish analysis
- [ ] **Barcode Scanning** - UPC lookup for packaged foods
- [ ] **Recipe Storage** - Save and reuse custom recipes

### **Technical Tasks**
- Integrate camera and voice recording
- Build barcode scanning with food database lookup
- Create recipe management system
- Implement complex dish analysis workflow

### **Success Criteria**
- Photo + voice analysis working for complex dishes
- Barcode scanning functional for packaged foods
- Recipe storage and reuse system operational

---

## **SPRINT 6: Educational Content & Expert Integration**
*Priority: MEDIUM | Duration: 2 weeks | Based on Educational Features*

### **Goals**
- Add expert content integration
- Implement scientific context for recommendations
- Create research citation system

### **Features from FEATURE_PLANNING.md Medium Priority**
- [ ] **Expert Video Integration** - Links to educational content (Huberman, Attia, etc.)
- [ ] **Scientific Debate Context** - Present multiple expert perspectives (e.g., Statin debates)
- [ ] **Research Citations** - Link AI recommendations to peer-reviewed studies

### **Technical Tasks**
- Curate and integrate expert content links
- Build debate context presentation system
- Add research citation functionality
- Create educational content strategy implementation

### **Success Criteria**
- Expert content properly integrated and attributed
- Multiple perspectives presented for controversial topics
- Research citations enhance AI recommendations

---

## Implementation Based on Existing Strategy

### **Monetization Alignment**
Following the monetization strategy from FEATURE_PLANNING.md:
- **Free Tier**: 100 food lookups/month, 3 AI analyses/month
- **Premium Tier ($9.99)**: Unlimited food logging, personal food database priority
- **Pro Tier ($19.99)**: Multi-LLM analysis, sleep correlation, advanced biomarkers
- **Enterprise ($49.99)**: White-label, API access, bulk management

### **LLM Strategy Implementation**
Following the phased approach from FEATURE_PLANNING.md:
- **Phase 1**: Implement Gemini Pro as second opinion (Sprint 2)
- **Phase 2**: Add Grok API when available
- **Phase 3**: Claude integration for specialized analysis

### **Technical Debt from FEATURE_PLANNING.md**
Ongoing improvements to be integrated into each sprint:
- **Error Handling**: Comprehensive throughout
- **Testing**: Automated tests for new features
- **Performance**: Database query optimization
- **Security**: Additional hardening
- **Monitoring**: APM implementation

---

## Next Steps

1. **Review Sprint 1 scope** against current Smart Food Entry implementation
2. **Validate priorities** with user feedback from the 2 active testers
3. **Confirm technical feasibility** of timeline estimates
4. **Begin Sprint 1 execution** focusing on the identified high-priority limitations

This roadmap now properly builds on your existing comprehensive planning work rather than duplicating it. 