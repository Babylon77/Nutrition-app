# V2 Development Workflow 🚀

## Branch Strategy 🌿

### **Production Branch: `master`**
- **Purpose**: Stable MVP (v1.x) for real users
- **Deployment**: Auto-deploys to production on Render
- **URL**: `https://nutrition-app-production.onrender.com`
- **Database**: Production MongoDB (`nutrition-app` database)
- **Rules**: 
  - Only hotfixes and stable releases
  - All changes via PR from `develop`
  - Never develop features directly on `master`

### **Development Branch: `develop`**
- **Purpose**: V2 feature development and integration
- **Deployment**: Auto-deploys to staging on Render
- **URL**: `https://nutrition-app-staging.onrender.com` 
- **Database**: Staging MongoDB (`nutrition-app-staging` database)
- **Rules**:
  - All V2 features developed here or in feature branches
  - Integration testing before merging to `master`
  - Can be "broken" during development

### **Feature Branches: `feature/feature-name`**
- **Purpose**: Individual feature development
- **Pattern**: `feature/bulk-food-entry`, `feature/supplements-tracking`
- **Workflow**: Branch from `develop` → merge back to `develop`
- **Deployment**: Local development only

## Workflow Steps 📋

### **1. Starting a New V2 Feature**
```bash
# Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/bulk-food-entry

# Develop your feature...
# (make commits)

# Push feature branch
git push -u origin feature/bulk-food-entry
```

### **2. Finishing a Feature**
```bash
# Push final changes
git push origin feature/bulk-food-entry

# Create PR: feature/bulk-food-entry → develop
# Review, test on staging, then merge

# Clean up
git checkout develop
git pull origin develop
git branch -d feature/bulk-food-entry
```

### **3. Releasing V2 to Production**
```bash
# When develop is stable and ready
git checkout master
git pull origin master

# Create PR: develop → master
# Title: "Release v2.0.0 - Major feature update"
# Review, test, then merge
```

## Environment Setup 🌍

### **Production Environment**
- **Branch**: `master`
- **URL**: `https://nutrition-app-production.onrender.com`
- **Database**: `nutrition-app` (live user data)
- **Users**: Real users, paying customers
- **Stability**: Must be rock solid

### **Staging Environment** 
- **Branch**: `develop`
- **URL**: `https://nutrition-app-staging.onrender.com`
- **Database**: `nutrition-app-staging` (test data)
- **Users**: You, testers, stakeholders
- **Purpose**: Integration testing, demos, user acceptance testing

### **Local Development**
- **Branch**: Any (feature branches, develop)
- **URL**: `http://localhost:3000`
- **Database**: Local MongoDB or separate dev database
- **Purpose**: Feature development, debugging

## Database Strategy 💾

### **Separate Databases**
```
Production:   nutrition-app         (real user data)
Staging:      nutrition-app-staging (test data)
Development:  nutrition-app-dev     (local/optional)
```

### **Data Management**
- **Production**: Never touch directly, only via app
- **Staging**: Reset/clean regularly, safe to experiment
- **Development**: Local data, can reset anytime

## Deployment Strategy 🚀

### **Auto-Deploy Rules**
```yaml
master branch  → Production (nutrition-app-production)
develop branch → Staging (nutrition-app-staging)  
feature branches → Local only
```

### **Release Process**
1. **Feature Development**: Work in feature branches
2. **Integration**: Merge features to `develop` branch
3. **Staging Testing**: Test on staging environment
4. **User Acceptance**: Let testers use staging
5. **Production Release**: Merge `develop` → `master`

## Feature Development Priorities 📊

### **Phase 1: Core UX Improvements**
- [ ] Bulk food entry interface
- [ ] Personal food database  
- [ ] Mobile-first UI redesign
- [ ] Supplements tracking section

### **Phase 2: Advanced Analytics**
- [ ] Multi-LLM second opinion
- [ ] Sleep integration
- [ ] Lifestyle factor tracking
- [ ] Enhanced health metrics

### **Phase 3: Advanced Features**
- [ ] Photo + voice input
- [ ] Educational content integration
- [ ] Advanced visualizations

## Testing Strategy 🧪

### **Local Testing**
- Manual testing during development
- Feature-specific testing

### **Staging Testing**
- Integration testing
- User acceptance testing
- Performance testing
- Cross-browser testing

### **Production Testing**
- Smoke tests after deployment
- User feedback monitoring
- Error tracking

## Hotfix Process 🚨

### **For Production Issues**
```bash
# Create hotfix branch from master
git checkout master
git checkout -b hotfix/critical-bug-fix

# Fix the issue
# (make commits)

# Deploy hotfix
git checkout master
git merge hotfix/critical-bug-fix
git push origin master  # Auto-deploys to production

# Merge back to develop
git checkout develop
git merge master
git push origin develop

# Clean up
git branch -d hotfix/critical-bug-fix
```

## Version Numbering 🔢

### **Semantic Versioning**
- **v1.x.x**: Current MVP (master branch)
- **v2.0.0**: Major V2 release
- **v2.1.0**: V2 feature additions
- **v2.0.1**: V2 bug fixes

### **Git Tags**
```bash
# Tag releases
git tag -a v2.0.0 -m "Release V2.0.0 - Bulk food entry and supplements"
git push origin v2.0.0
```

## Environment Variables 🔐

### **Production (master)**
```
MONGODB_URI=mongodb+srv://.../@cluster.../nutrition-app
NODE_ENV=production
```

### **Staging (develop)**
```
MONGODB_URI=mongodb+srv://.../@cluster.../nutrition-app-staging
NODE_ENV=production  # (still uses production build)
```

## Quick Commands 📝

### **Switch to Development**
```bash
git checkout develop
npm run dev
```

### **Check Current Branch Status**
```bash
git branch -a
git status
```

### **Deploy to Staging**
```bash
git checkout develop
git push origin develop  # Auto-deploys
```

### **Deploy to Production**
```bash
# Create PR: develop → master via GitHub
# Or direct merge if you're confident:
git checkout master
git merge develop
git push origin master  # Auto-deploys
```

## Benefits of This Approach ✅

1. **🛡️ Stability**: MVP stays stable for real users
2. **🚀 Innovation**: Freedom to experiment in V2 without breaking production
3. **👀 Visibility**: Stakeholders can see V2 progress on staging
4. **🔄 Flexibility**: Easy to switch between versions
5. **🛠️ Hotfixes**: Can quickly fix production issues
6. **📊 Testing**: Proper testing environment before release
7. **👥 User Acceptance**: Users can test V2 before release

---

**Current Status**: Ready for V2 development!
**Next Step**: Choose first V2 feature and create feature branch 