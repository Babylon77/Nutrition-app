# Feature Planning & Roadmap 🚀

## Current MVP Status ✅
- **Deployment**: Live on Render with auto-deploy
- **Users**: 2 active testers
- **Database**: MongoDB Atlas (production)
- **Status**: Fully functional MVP

## Current MVP Limitations 📝

### Food System Limitations
- ✅ **Bulk Food Entry**: One item at a time (should allow multiple foods before API call) → **COMPLETED (Sprint 1)**
- ✅ **Personal Food Database**: No user-specific food history/favorites (should search personal DB first) → **COMPLETED (Sprint 1)**
- ✅ **User Food Adjustments** - Allow quantity/serving size adjustments with proportional scaling → **COMPLETED (Sprint 1)**
- [ ] **API Optimization**: Each food = separate API call (costly and slow)
- [ ] **Advanced Input Modes**: No photo + voice/text description for complex dishes
- [ ] **Supplements Tracking**: No separate section for daily supplements, vitamins, medications

### Health Analytics Limitations
- ✅ **Single LLM Analysis**: No second opinion or cross-model validation → **COMPLETED (Sprint 3.1)**
- [ ] **Limited Biomarkers**: Missing key hormones (Testosterone, etc.)
- [ ] **Manual PDF Processing**: No LLM-powered extraction from bloodwork PDFs
- [ ] **Basic Health Metrics UI**: Manual entry not intuitive enough
- [ ] **No Sleep Integration**: Missing critical sleep data correlation
- [ ] **No Lifestyle Tracking**: No alcohol, smoking, or other lifestyle factor tracking
- [ ] **No Health Metrics History**: No historical tracking and trend analysis
- [ ] **No Educational Context**: No links to research, debates, expert perspectives
- ✅ **AI Data Context**: AI assistant lacked full access to user data and app context for optimal advice. → **COMPLETED (Sprint 3.1)**

### UX/UI Limitations
- ✅ **Mobile Experience**: Basic responsive design (needs mobile-first approach) → **COMPLETED (Sprint 1)**
  - ✅ Touch-optimized food entry with responsive design
  - ✅ Responsive Smart Food Entry form layout
  - ✅ Touch-friendly action buttons and controls
- [ ] **Micronutrient Display**: Takes too much room on food log (needs cleanup)
- ✅ **Onboarding**: No guided tour for new users → **COMPLETED (Sprint 1)** 
  - ✅ React 19-compatible tutorial system
  - ✅ Progressive disclosure onboarding 
  - ✅ Contextual help buttons per page
  - ✅ Auto-triggers for first-time users
  - ✅ Feature-specific tutorials (food entry, analytics, bloodwork)
  - ✅ Tutorial content now part of AI Assistant context. → **COMPLETED (Sprint 3.1)**
- [ ] **Food Search**: Could be more intuitive with autocomplete/suggestions
- [ ] **Progress Visualization**: Basic charts (could be more engaging)
- [ ] **Goal Setting**: Limited customization options
- [ ] **Notification System**: No reminders or alerts
- ✅ **AI Recommendation Actions**: Can't save/highlight LLM suggestions into actionable checklist → Partially addressed by conversational food logging. (AI can log food, future work for generic action items). **(Food logging COMPLETED - Sprint 3.1)**
- ✅ **AI Assistant UX**: Output format needed improvement for readability. → **COMPLETED (Sprint 3.1)**

### Technical Limitations
- [ ] **API Dependency**: Relies on OpenAI API (cost/rate limits/availability)
- [ ] **Offline Capability**: None (requires internet connection)
- [ ] **Data Export**: No export functionality for user data
- [ ] **Barcode Scanning**: No UPC/barcode lookup for packaged foods

### Feature Gaps
- [ ] **Social Features**: No sharing, friends, or community aspects
- [ ] **Integrations**: No fitness tracker, smart scale, or other app connections
- [ ] **Advanced Analytics**: Basic AI analysis (could be more sophisticated)
- [ ] **Meal Planning**: No forward-planning or scheduling features
- [ ] **Shopping Lists**: No grocery list generation from meal plans

## User Feedback Tracking 📊

### User #1 Feedback
*[To be filled based on user testing]*

### User #2 Feedback  
*[To be filled based on user testing]*

## Feature Prioritization Framework 🎯

### High Priority (MVP+ Features)
*Critical improvements for core user experience and cost optimization*

#### Food System Enhancements
- [ ] **Advanced Input Methods (Prioritized)**:
    - [ ] **Barcode Scanning** - UPC lookup for packaged foods (move from Medium Priority).
    - [ ] **Image-Based Food Recognition (Vision API)** - e.g., gpt-4o-vision for plate recognition (move from Medium Priority - Photo + Voice Mode).
- [ ] **"Yesterday Again" / Quick Meal Copy** - One-tap to log a previous day's meal or a common meal.
- [ ] **Bulk Food Entry Interface** - Add multiple foods before single API call
- [ ] **Personal Food Database** - Search user's previous foods first, then API
- [ ] **User Food Adjustments** - Allow quantity/serving size adjustments with proportional scaling
- [ ] **Mobile-First UI Redesign** - Optimize for mobile devices
- [ ] **Micronutrient Display Cleanup** - Condensed, scannable format
- ✅ **Conversational Food Logging (AI Assistant)** - Log food via AI chat. → **COMPLETED (Sprint 3.1)**

#### Core UX Improvements  
- [ ] **Supplements Section** - Separate tracking for daily supplements, vitamins, medications
- [ ] **AI Recommendation Actions** - Save/highlight LLM suggestions into master checklist (General action items TBD)
- [ ] **Enhanced Health Metrics UI** - More intuitive manual entry for biomarkers
- ✅ **AI Assistant UX/Readability** - Improved output formatting. → **COMPLETED (Sprint 3.1)**
- [ ] **Proactive & Personalized AI Assistant**:
    -   [ ] AI Assistant to proactively initiate conversations or provide timely prompts/nudges to encourage engagement (e.g., "Haven't logged breakfast yet?", "How are you feeling today for your journal?").
    -   [ ] Define and implement a distinct personality for the AI Assistant: based on a 16-year-old interested in nutrition/fitness; blunt, to-the-point, knowledgeable, and encouraging.

#### Advanced Analytics Features
- ✅ **Multi-LLM Second Opinion** - Cross-validate analysis with Gemini vs ChatGPT → **COMPLETED (Sprint 3.1)**
- [ ] **LLM-Powered PDF Extraction** - Automated bloodwork data extraction and formatting
- [ ] **Expanded Biomarker Support** - Add Testosterone and other key hormones
- [ ] **Sleep Integration** - Connect sleep data for comprehensive health correlation (Huberman/Johnson inspired)
- [ ] **Lifestyle Factor Tracking** - Manual alcohol consumption, smoking, substance tracking
- [ ] **Health Metrics History** - Historical tracking with trend analysis and correlations
- ✅ **AI Assistant Full Data Access** - Provide AI with food logs, personal foods, supplements, bloodwork, app context. → **COMPLETED (Sprint 3.1)**
- [ ] **Health Journal with AI Analysis** - Allow users to keep free-form journal entries with optional AI-driven insights.
    -   Manual journal entry via dedicated page/tab.
    -   AI Assistant integration for creating journal entries (e.g., "create note").
    -   Optional AI analysis of journal content for correlations, mood tracking, potential interaction identification.
- [ ] **Weight Tracking & Management**:
    -   [ ] Dedicated interface for users to log their weight regularly.
    -   [ ] Historical weight tracking with visualization (charts/graphs).
    -   [ ] Automatic recalculation/update of RDAs and calorie/macro goals based on weight changes (ensure this integrates with existing RDA logic).
    -   [ ] Configurable reminders for weight check-ins (e.g., weekly default).

### Medium Priority (V2 Features)
*Valuable additions that enhance but don't fundamentally change core experience*

#### Advanced Input Methods
- [ ] **Native In-App Voice Input for AI Assistant**: Implement a microphone button/feature directly within the AI Assistant UI for native voice commands, rather than relying solely on OS-level voice-to-text.
- [ ] **Barcode Scanning** - UPC lookup for packaged foods (move from Medium Priority).
- [ ] **Image-Based Food Recognition (Vision API)** - e.g., gpt-4o-vision for plate recognition (move from Medium Priority - Photo + Voice Mode).
- [ ] **Photo + Voice Mode (Refined)** - Focus on voice/text description for complex dish analysis if full image recognition is a larger effort, or as a fallback.
- [ ] **Recipe Storage** - Save and reuse custom recipes

#### Enhanced Analytics & Integration
- [ ] **Comprehensive Health Integration** - Include supplements/medications in LLM analysis
- [ ] **Advanced Progress Visualization** - More engaging charts and trends
- [ ] **Goal Customization** - More flexible goal-setting options
- [ ] **Sleep Quality Correlations** - Analyze late-night eating, alcohol effects on sleep
- [ ] **Manual Sleep Entry** - Sleep scores, HRV input from devices (Garmin, Fitbit, Oura)

#### Educational & Context Features
- [ ] **Expert Video Integration** - Links to educational content (Huberman, Attia, etc.)
- [ ] **Scientific Debate Context** - Present multiple expert perspectives (e.g., Statin debates)
- [ ] **Research Citations** - Link AI recommendations to peer-reviewed studies

### Low Priority (Future Considerations)
*Advanced features for later versions*

#### Social & Integration Features
- [ ] **Social Features**: Sharing, friends, community aspects
- [ ] **Fitness Tracker Integration**: Smart scale, activity tracker connections
- [ ] **Meal Planning**: Forward-planning and scheduling features
- [ ] **Shopping Lists**: Grocery list generation from meal plans

#### Advanced Capabilities
- [ ] **Offline Mode**: Local data and basic functionality without internet
- [ ] **Data Export**: Comprehensive user data export options
- [ ] **Notification System**: Smart reminders and alerts
- [ ] **Advanced Sleep API Integration** - Direct API connections to Garmin, Fitbit, Oura (V3/V4)

### Further Feature Enhancement Ideas (Brainstormed)
*   **Recipe Analysis & Storage:** Allow users to input ingredients for a recipe, get a full nutritional breakdown, and save it for quick logging.
*   **Barcode Scanning for Packaged Foods:** Implement camera-based barcode scanning to automatically fetch and log nutritional information.
*   **Advanced Progress Visualization & Reporting:** Offer customizable weekly/monthly reports, trend lines for specific nutrients against other metrics, and more engaging progress views.
*   **Integration with Wearables/Health Platforms:** Allow connections with services like Apple Health, Google Fit, Fitbit to import activity, sleep, or weight data.
*   **Smart Meal & Snack Suggestions:** AI-powered suggestions for meals/snacks based on remaining calorie/macro targets, preferences, and time of day.

## Technical Debt & Improvements 🔧

### Code Quality
- [ ] **Error Handling**: Could be more comprehensive
- [ ] **Testing**: No automated tests currently
- [ ] **Performance**: Database query optimization
- [ ] **Security**: Additional security hardening
- [ ] **Monitoring**: Application performance monitoring (APM)

### Infrastructure
- [ ] **Backup Strategy**: Automated database backups
- [ ] **CDN**: Static asset delivery optimization
- [ ] **Scaling**: Horizontal scaling preparation
- [ ] **Monitoring**: Health checks and alerting

### New Technical Debt Items
- [ ] **Refactor Service Boundaries**: Improve backend architecture by separating controllers, services (business logic), and models (DB access).
- [ ] **Centralized Error Handling**: Implement a central Express error-handler and typed error classes.
- [ ] **Database Indexing**: Create necessary compound indexes (e.g., on {userId, date} for logs) to optimize query performance.
- [ ] **Enhanced Rate Limiting & Caching**: Implement robust rate limiting (e.g., `express-rate-limit`) and caching for external API calls (e.g., OpenAI, Gemini).
- [ ] **Asynchronous AI Processing**: Move synchronous AI calls (e.g., food analysis) to a job queue (e.g., BullMQ) with client-side polling/WebSockets for completion notifications.
- [ ] **Frontend Performance Optimization**:
    - [ ] Memoize components and optimize state management in food logger to reduce re-renders.
    - [ ] Analyze and reduce bundle size (e.g., MUI tree-shaking, replace lodash, use webpack-bundle-analyzer).

## Competitive Analysis 📈

### Direct Competitors
- MyFitnessPal
- Cronometer  
- Lose It!
- Noom

### Differentiation Opportunities
- AI-powered bloodwork correlation
- Conservative, health-focused approach
- Comprehensive micronutrient tracking
- Medical-grade analysis integration

## Success Metrics 📊

### User Engagement
- Daily active users
- Food logging frequency
- Feature utilization rates
- Session duration

### Product Success
- User retention rates
- Goal achievement rates
- AI analysis usage
- User satisfaction scores

## Next Sprint Planning 🗓️

### Sprint Goals
*[To be defined based on user feedback and priorities]*

### Definition of Done
- [ ] Feature implemented and tested
- [ ] User feedback incorporated
- [ ] Documentation updated
- [ ] Deployed to production

## LLM Strategy & Implementation 🤖

### Multi-LLM Second Opinion Roadmap
**Phase 1 (Immediate)**: Implement Gemini Pro as second opinion
- **Cost**: ~$0.50/1M tokens (cheaper than GPT-4)
- **Availability**: Ready now
- **Integration**: Package full analysis + data → send to Gemini → compare outputs

**Phase 2 (When Available)**: Add Grok API
- **Strategy**: Grok likely to be competitively priced
- **Positioning**: Elon's approach may provide unique health perspectives
- **Feature**: Let users choose second opinion LLM (Gemini vs Grok)

**Phase 3 (Advanced)**: Claude integration for specialized analysis
- **Use Case**: Specific medical/research-focused second opinions
- **Cost**: Higher but potentially worth it for premium users

### Educational Content Strategy 📚
**Approach**: Curated links + original analysis
- **Video Content**: Link to YouTube (fair use) with proper attribution
- **Research Papers**: Direct citations (always allowed)
- **Expert Quotes**: With attribution (fair use guidelines)
- **Original Value**: Our analysis/summary of different perspectives
- **Avoid**: Reproducing full copyrighted content

**Content Examples**:
- Huberman sleep protocols with app correlation suggestions
- Attia vs skeptics on statins with bloodwork interpretation
- Johnson's biomarker optimization with tracking recommendations

## Monetization Strategy 💰

### Revised Cost Analysis
**Actual API Costs** (based on real usage):
- ~25 food lookups + 1 analysis = **$0.04/day**
- Monthly heavy user cost = **~$1.20**
- Average user cost = **~$0.15/month**

### Free Tier (Generous - Acquisition Focused)
*Core functionality to establish user base*
- [ ] **100 food lookups/month** (generous limit encourages real usage)
- [ ] **3 AI analyses/month** (enough to experience value)
- [ ] Basic nutrition tracking and dashboard
- [ ] Manual bloodwork entry
- **Cost per user**: ~$0.15/month
- **Strategy**: Let users get genuinely hooked on functionality

### Premium Tier ($9.99/month)
*Enhanced features for serious health trackers*
- [ ] **Unlimited food logging** (removes usage anxiety)
- [ ] Personal food database with search priority
- [ ] Bulk food entry (cost optimization)
- [ ] Unlimited AI analyses
- [ ] Supplements tracking
- [ ] LLM-powered PDF extraction
- [ ] Advanced health metrics with history
- [ ] Sleep and lifestyle factor tracking

### Pro Tier ($19.99/month)
*Comprehensive health optimization platform*
- [ ] All Premium features
- [ ] **Multi-LLM Second Opinion** analysis (Gemini + ChatGPT)
- [ ] Sleep correlation analysis
- [ ] Advanced biomarker tracking (Testosterone, etc.)
- [ ] Educational content access with expert perspectives
- [ ] Priority support
- [ ] Data export capabilities
- [ ] Early access to new features

### Enterprise/Clinical ($49.99/month)
*For healthcare professionals and serious biohackers*
- [ ] All Pro features
- [ ] White-label options
- [ ] API access for integrations
- [ ] Custom analysis parameters
- [ ] Bulk user management
- [ ] Advanced sleep API integrations (when available)

### Conversion Strategy
**Target Metrics**:
- **Free Tier Cost**: $0.15/user/month
- **Target Conversion**: 10-15% to Premium ($1.50 revenue per free user)
- **Break-even**: 6-7% conversion rate
- **Growth Strategy**: Feature value > usage limits (users upgrade for capabilities, not quotas)

**Trial Strategy**: 14-day Premium trial → downgrade to free tier (not hard paywall)

## Recent Debugging & Fixes (Post-Sprint 2.5) 🛠️

### v1.0.4 - Render Stability & Data Integrity (06/01/2025)
- ✅ **Fixed: Production Session Store**: Resolved `connect.session() MemoryStore` warning by integrating `connect-mongo` for persistent MongoDB session storage on Render. This was a foundational step for session reliability.
- ✅ **Fixed: Food Queue Processing on Render (Evolution)**:
    - ✅ Initial attempts to stabilize the session-based food queue on Render included adding explicit `req.session.save()` calls after queue modifications in the backend.
    - ✅ While this provided some improvement, persistent issues with queue items being overwritten on Render led to a more comprehensive solution: a full refactor to client-side queue management. This involved making the backend stateless for queue building and having the frontend send the complete queue for processing (detailed as Sprint 2.75 in `SPRINT_ROADMAP.md`). This ultimately resolved the queue stability problems.
- ✅ **Fixed: Render Build Fallthrough Error**: Corrected TypeScript error `TS7029: Fallthrough case in switch` in `backend/src/routes/food.ts` by adding a `break;` statement.
- ✅ **Addressed: API Rate Limiting on Render**:
    - Temporarily increased backend rate limits and frontend debounce time for `SmartFoodEntry` search.
    - Implemented client-side caching for personal food search results in `SmartFoodEntry.tsx` as a long-term optimization to reduce API calls.
- **Fixed: Calorie Meter & Food Log Date Discrepancies (Local & Render)**: Ensured consistent `YYYY-MM-DD` string handling for `FoodLog.date` in backend queries (`/api/food/summary`, `/api/food/logs/:date`) and storage, resolving issues where "today's" foods weren't correctly reflected due to timezone/date object mismatches.
- **Fixed: Food Logs Not Appearing (DB Date Type Mismatch)**: Corrected backend `POST` and `PUT` routes for `/api/food/logs/:date` to save dates as `YYYY-MM-DD` strings, matching query logic and fixing data retrieval.
- **Fixed: Local Backend Startup Error (`targetDate` not found)**: Resolved TypeScript error in `backend/src/routes/food.ts` by correcting `targetDate` references used for response formatting to use `new Date(dateString)`, ensuring dev server stability.

### v1.0.3 - Timezone Bug Fix (5/29/2025)
- **Fixed**: Date storage timezone issue where food logged in user's local time was appearing on wrong date
- **Technical**: Changed from UTC Date objects to local date strings in both frontend and backend
- **Impact**: Food logs now correctly appear on the date they were entered in user's local timezone

### v1.0.2 - Production Deployment
- **Fixed**: API URL configuration for production vs development
- **Fixed**: MongoDB Atlas network access and connection
- **Added**: Auto-deploy on git push to master branch

### Further UI/UX Improvement Ideas (Brainstormed)
*   **Dashboard Customization:** Allow users to personalize the main dashboard by choosing which widgets are visible and their order.
*   **Enhanced Food Search with Quick Add Filters:** Improve food search with more robust autocomplete (showing key nutrition facts in results) and filters for "recently logged," "personal foods," etc.
*   **Interactive Goal Setting & Adjustment:** Make setting nutrition/weight goals more visual and interactive (e.g., sliders, visual feedback on impacts).
*   **Streamlined "Quick Log" for Common Items/Meals:** Offer a feature for one-click logging of frequently eaten foods or saved meals.
*   **Contextual Micro-Interactions & Feedback:** Add subtle animations or micro-interactions for better visual feedback and a more polished feel.

## Go-To-Market & Positioning Notes

- **Target Niche**: Focus initial efforts on the quantified-self / bio-hacker community (e.g., relevant subreddits) who are often early adopters and value detailed tracking but may find current food logging cumbersome.
- **Pricing USP**: Emphasize a "Free-forever logging; pay only for pro analytics" model. Highlight that core food logging, personal DB, and basic supplement tracking are free, with premium charges for advanced AI analysis, multi-LLM, detailed correlations, etc.
- **Key Differentiators to Highlight**: AI macro-breakdown for custom foods, supplement tracking, PDF-bloodwork parsing (when fully implemented), multi-LLM second opinions.

## Security & Compliance Considerations

- Key security and compliance measures, including password storage, PII encryption, consent flows, and data deletion rights, are tracked in `SECURITY_AND_COMPLIANCE.md`.
- [ ] Implement granular user consent flows, especially for sensitive data (bloodwork, AI-analyzed journal entries).
- [ ] Develop a robust data deletion endpoint and process per user request.

---

**Last Updated**: [Date]  
**Next Review**: [Date]  
**Product Owner**: [Name] 