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

## **SPRINT 2.75: Client-Side Queue Refactor** ✅ **COMPLETED**
*Priority: CRITICAL | Duration: 0.5 week | Based on Render Stability Issues*

### **Goals**
- ✅ Resolve food queue overwriting issue on Render by making queue management fully client-side.
- ✅ Achieve true statelessness for the queue-building process in the backend.
- ✅ Improve application robustness and predictability in a multi-instance environment.

### **Rationale**
- Persistent issues with `req.session.foodQueue` not reliably persisting between requests on Render when using `connect-mongo`, leading to items being overwritten.
- Adopting a fully client-managed queue for the "Smart Food Entry" feature aligns better with stateless backend principles and is more resilient to cloud platform behaviors (e.g., instance restarts, multiple PIDs).

### **Key Changes**
- **Frontend (`SmartFoodEntry.tsx`)**:
  - ✅ The component will now manage the food queue entirely in its local React state.
  - ✅ Functions `addToQueue`, `removeFromQueue`, `clearQueue` will modify this local state directly, without API calls for these actions.
  - ✅ A unique client-side ID will be generated for each queued item.
  - ✅ The `loadQueue` function (previously fetching from session) will be removed.
  - ✅ The `processQueue` function will send the complete, client-managed queue to the backend.
- **Backend (`/api/food/smart-entry` route)**:
  - ✅ Server-side session management for the food queue (`req.session.foodQueue`) will be removed for the queue-building phase.
  - ✅ API actions `add_to_queue`, `remove_from_queue`, `clear_queue`, `get_queue` will be deprecated/removed as these operations are now client-side.
  - ✅ The `process_queue` action will solely rely on the `itemsToProcess` array sent from the client in the request body.

### **Success Criteria**
- ✅ Users can add multiple food items to the queue in `SmartFoodEntry` on Render without previous items being overwritten.
- ✅ The food queue operates reliably and consistently across both development and production (Render) environments.
- ✅ Backend `smart-entry` endpoint is simplified by removing session-based queue logic.

---

## **Interim Stability Fixes & Optimizations (Post-Sprint 2.5 / Pre-Sprint 2.75)** 🛠️
*Prior to the full client-side queue refactor (Sprint 2.75), several critical fixes and improvements were implemented to enhance application stability on Render and address data integrity issues.*

- **Render Deployment Stability:**
  - **Session Management**: Implemented `connect-mongo` for persistent MongoDB session storage. This resolved `MemoryStore` warnings and was a foundational step towards ensuring sessions could persist across deployments, though queue-specific issues remained until Sprint 2.75.
  - **Food Queue Interim Fixes**: Addressed a race condition in food queue processing by adding explicit `req.session.save()` calls in relevant backend routes. While this provided some improvement, persistent queue overwriting issues on Render necessitated the more comprehensive client-side refactor in Sprint 2.75.
  - **Build Error Resolution**: Fixed a TypeScript fallthrough error (`TS7029`) in `backend/src/routes/food.ts` that was causing Render builds to fail.
  - **Rate Limiting Adjustments**: Temporarily increased backend rate limits and frontend debounce times to mitigate "Too many requests" errors on Render. Implemented client-side caching for personal food search as a long-term optimization.

- **Data Integrity & Consistency (Local & Render):**
  - **Date Handling for Food Logs**: Standardized on `YYYY-MM-DD` string format for `FoodLog.date` across storage and querying. This fixed issues with calorie meter discrepancies and food logs not appearing for the correct date due to timezone or `Date` object vs. string mismatches.
  - **Backend `targetDate` Error**: Corrected a TypeScript error in `backend/src/routes/food.ts` where `targetDate` was undefined (after date string refactor), ensuring the backend dev server could start and responses were formatted correctly.

---

## **SPRINT 3.1: AI Enhancements**
*Priority: HIGH | Duration: [Estimate TBD]*

### **Goals & Key Tasks**

1.  **Improve AI Assistant Readability & UX**
    -   ✅ Task: Redesign AI Assistant output format for improved readability and user experience on both mobile and desktop. Apply UI/UX best practices, considering clear typography, adequate spacing, and potentially using UI elements like cards or distinct sections for different types Mof information. (COMPLETED)

2.  **Expand AI Assistant Data Access & Context**
    -   ✅ Task: Ensure the AI Assistant has comprehensive access to and can effectively utilize the user's full database context. This includes food logs, personal foods, supplement logs, and bloodwork data to provide more personalized and contextually aware advice and actions. (COMPLETED)
    -   ✅ Task: Updated tutorial content (`TUTORIAL_CONTENT.md`) and integrated it into the AI Assistant's context. (COMPLETED)

3.  **Enable Conversational Food Logging via AI Assistant**
    -   ✅ Task: Implement functionality allowing the AI Assistant to directly log food items based on conversational user commands (e.g., "log food [details]...", "add [food] to my breakfast..."). (COMPLETED)
    -   ✅ Task: Update the AI Assistant's introductory messages and helpful instructions to inform users about this new food logging capability. (COMPLETED)

4.  **Implement Multi-LLM Second Opinion Feature for Analysis**
    -   ✅ Task: Integrate a new LLM provider (Gemini) by adding support for its API key in the backend configuration. (COMPLETED)
    -   ✅ Task: Design and implement a "2nd Opinion" button/UI flow on the Analysis page, allowing users to select an alternative LLM (Gemini or other OpenAI models). (COMPLETED)
    -   ✅ Task: Implement the backend logic required to request a new analysis from the selected alternative LLM using the same input data as the original analysis, including a comparative analysis step. (COMPLETED)
    -   ✅ Task: Design and implement a clear UI to present the second opinion, including displaying it in the analysis details view. (COMPLETED)

### **Success Criteria**
-   ✅ AI Assistant interactions are more readable and user-friendly. (COMPLETED)
-   ✅ AI Assistant demonstrates improved understanding and utilization of user's comprehensive health data, including app functionality via tutorial content. (COMPLETED)
-   ✅ Users can successfully log food items through conversational commands with the AI Assistant. (COMPLETED)
-   ✅ The "2nd Opinion" feature is functional, allowing users to get and compare analyses from different LLMs. (COMPLETED)

### **Post-Sprint 3.1 Refinements**
-   ✅ **Calorie and Macronutrient Goal Consistency**: Standardized calorie and macronutrient (protein, carbs, fat) goal calculation logic across the Dashboard and Food Log pages to ensure consistent targets are displayed to the user. This involved aligning activity multipliers, weekly weight change caps (adjusted to 3 lbs/week), and macro derivation logic (protein based on body weight, fat as 25% of target calories, carbs as remainder).

---

## **SPRINT 3: Advanced Analytics & AI Features**
*Priority: HIGH | Duration: 2 weeks | Based on Advanced Analytics Features*

### **Goals**
- Implement AI recommendation action system
- Develop specific AI-driven analyses for combined health data (building on data access from Sprint 3.1)
- Build cross-correlation analytics between diet, supplements, and biomarkers
- Complete pending health metric features (hormones, bloodwork UI)

### **User Stories**
1. **As a user, I want second opinions on my health analysis from different AI models**
2. **As a user, I want to save and track AI recommendations as actionable items**
3. **As a user, I want my supplements included in my overall health analysis**
4. **As a user, I want to see correlations between my diet, supplements, and lab results**

### **Features from FEATURE_PLANNING.md High Priority**
- [ ] **Multi-LLM Second Opinion** - ~~Cross-validate analysis with Gemini vs ChatGPT~~ **(Addressed by SPRINT 3.1)**
    -   ~~Gemini Pro integration for second opinion analysis~~ 
    -   ~~Side-by-side comparison of AI insights~~ 
    -   ~~User preference for primary vs secondary analysis model~~ 
- [ ] **AI Recommendation Actions** - Save/highlight LLM suggestions into master checklist
    -   Actionable recommendation extraction
    -   Personal health action items tracking
    -   Progress tracking on AI suggestions
- [ ] **Comprehensive Health Integration - Analytical Applications** - (Data access provided by Sprint 3.1)
    -   [ ] Combined diet + supplements analysis by LLM
    -   [ ] Potential drug-nutrient interaction warnings (research and implement if feasible)
    -   [ ] Holistic health optimization recommendations based on integrated data
- [ ] **Advanced Correlation Analytics** - Cross-analysis between diet, supplements, and biomarkers
    -   Statistical correlation identification
    -   Trend analysis across all health data
    -   Predictive insights based on historical patterns

### **Technical Tasks**
- ~~Integrate Gemini Pro API for second opinion analysis~~ **(Moved to SPRINT 3.1)**
- Build recommendation action tracking system
- Create comprehensive data aggregation for multi-source analysis (if not fully covered by AI data access in Sprint 3.1)
- Implement correlation algorithms across diet/supplements/biomarkers
- ~~Design AI comparison interface~~ **(Moved to SPRINT 3.1)**

### **Success Criteria**
- ~~Multi-LLM analysis providing valuable second opinions~~ **(Addressed by SPRINT 3.1)**
- Users can save and track AI recommendations effectively
- Supplements data integrated into overall health analysis leading to actionable insights (e.g., interaction warnings)
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
- [ ] **Investigate & Improve Long-String Food Logging**: Address issue where very long, descriptive food log entries (e.g., full meal descriptions) result in generic logging (like "dinner") without detailed calorie/nutrient breakdown. Evaluate potential LLM limitations, input string length limits, or parsing issues. Consider testing with alternative LLM models for better handling of complex, lengthy food descriptions.

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

## Stubborn Styling Issues (To Be Addressed Later)
*A running list of UI issues that require further investigation or different approaches.*

- [ ] **ARIA Warning on Dialog Close:** Persistent "Blocked `aria-hidden` on a focused element" warning when closing the "Generate New Analysis" dialog in `frontend/src/pages/Analysis.tsx`. This occurs despite various attempts to manage focus restoration.
- [ ] **Chip Outline Cut Off:** The `Chip` component displaying the second opinion model (e.g., "2nd Opinion: Gemini 1.5 Flash") in `frontend/src/pages/Analysis.tsx` has its top border/outline appearing cut off, despite attempts to fix with explicit padding, border, and line-height styles.

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