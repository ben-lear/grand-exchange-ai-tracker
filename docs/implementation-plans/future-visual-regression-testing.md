# Visual Regression Testing with Chromatic - Skeleton Plan

**Created:** January 19, 2026  
**Status:** Future / Out of Scope  
**Priority:** LOW (post-implementation enhancement)  
**Estimated Duration:** 2-3 hours setup + ongoing maintenance  
**Dependencies:** Requires 016-ui-component-standardization.md completion

## 🎯 Objective

Implement automated visual regression testing for all Storybook components using Chromatic. Catch unintended visual changes before they reach production and maintain consistent UI across updates.

## Prerequisites

**Required Before Starting:**
- [ ] 016-ui-component-standardization.md fully complete
- [ ] All 47 components have Storybook stories
- [ ] Storybook builds successfully (`npm run build-storybook`)
- [ ] Component library is stable (no active major refactoring)

## Overview

### What is Chromatic?

Chromatic is a visual regression testing service that:
- Captures screenshots of every Storybook story
- Compares screenshots against baseline on each commit
- Highlights pixel-level differences
- Integrates with GitHub pull requests
- Provides UI review and approval workflow

### Benefits

1. **Catch Visual Bugs Early** - Before code review
2. **Prevent Regressions** - Ensure changes don't break existing components
3. **Document Visual History** - Timeline of component evolution
4. **Streamline Code Review** - Visual diffs in PR comments
5. **Cross-Browser Testing** - Test Chrome, Firefox, Safari rendering

### Cost Considerations

**Chromatic Pricing:**
- Free tier: 5,000 snapshots/month
- Paid plans: Start at $149/month

**Snapshot Calculation:**
- 47 components × ~3 stories each = ~141 stories
- 141 stories × 1 snapshot each = 141 snapshots per build
- ~35 builds per month (conservative) = ~4,935 snapshots/month
- ✅ Fits within free tier

---

## Phase 1: Chromatic Setup (1 hour)

### 1.1 Create Chromatic Account
**Priority:** CRITICAL

**Steps:**
1. Visit [chromatic.com](https://www.chromatic.com/)
2. Sign up with GitHub account
3. Connect to `grand-exchange-ai-tracker` repository
4. Generate project token

---

### 1.2 Install Chromatic Package
**Priority:** CRITICAL

**Command:**
```bash
cd frontend
npm install --save-dev chromatic
```

**Package:** `chromatic@^11.0.0`

---

### 1.3 Add Chromatic Scripts
**Priority:** CRITICAL

**File:** `frontend/package.json`

**Add Scripts:**
```json
{
  "scripts": {
    "chromatic": "chromatic --project-token=${CHROMATIC_PROJECT_TOKEN}",
    "chromatic:ci": "chromatic --exit-zero-on-changes"
  }
}
```

**Flags Explained:**
- `--project-token`: Authentication token (from environment variable)
- `--exit-zero-on-changes`: Don't fail CI on visual changes (requires manual review)

---

### 1.4 Configure Environment Variables
**Priority:** CRITICAL

**File:** `frontend/.env.local` (local development)
```env
CHROMATIC_PROJECT_TOKEN=your-project-token-here
```

**GitHub Secrets:** (for CI/CD)
1. Go to Repository Settings → Secrets → Actions
2. Add secret: `CHROMATIC_PROJECT_TOKEN`
3. Value: Project token from Chromatic dashboard

---

### 1.5 Create Baseline Snapshots
**Priority:** CRITICAL

**Command:**
```bash
cd frontend
npm run chromatic
```

**Expected Output:**
```
Build 1 published
View build: https://www.chromatic.com/build?appId=xxx&number=1
✔ Captured 141 snapshots
✔ Build passed
```

**Result:** First build establishes baseline for all components

---

## Phase 2: CI/CD Integration (30 minutes)

### 2.1 Create GitHub Actions Workflow
**Priority:** HIGH

**New File:** `.github/workflows/chromatic.yml`

**Content:**
```yaml
name: Chromatic Visual Testing

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/src/**'
      - 'frontend/.storybook/**'

jobs:
  chromatic:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full git history for Chromatic
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Run Chromatic
        working-directory: frontend
        run: npm run chromatic:ci
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
      
      - name: Comment PR with Chromatic link
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🎨 Visual regression tests completed! [View Chromatic build](Build URL will be in workflow logs)'
            })
```

**Triggers:**
- On pull request to main/develop
- Only when frontend files change
- Full git history for accurate diffs

---

### 2.2 Update Pull Request Template
**Priority:** MEDIUM

**File:** `.github/pull_request_template.md`

**Add Section:**
```markdown
## Visual Changes

- [ ] Reviewed Chromatic visual diffs (if applicable)
- [ ] Approved all intentional visual changes
- [ ] No unintended visual regressions
```

---

## Phase 3: Configuration & Optimization (30 minutes)

### 3.1 Configure Chromatic Settings
**Priority:** MEDIUM

**New File:** `frontend/.storybook/chromatic.config.js`

**Content:**
```javascript
module.exports = {
  // Ignore certain stories
  ignorePatterns: [
    '**/docs/**', // Ignore documentation stories
  ],
  
  // Diff threshold (0-1, lower = more sensitive)
  diffThreshold: 0.063, // ~6.3% threshold
  
  // Disable animations for consistent snapshots
  disableAnimations: true,
  
  // Viewport sizes to test
  viewports: [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 1280, height: 720, name: 'Desktop' },
  ],
  
  // Browser configurations
  browsers: [
    { name: 'chrome', version: 'latest' },
  ],
};
```

---

### 3.2 Optimize Snapshot Count
**Priority:** MEDIUM

**Strategy:** Reduce unnecessary snapshots to stay within free tier

**Options:**
1. **Skip Non-Visual Stories**
```typescript
// In .storybook/preview.ts
export const parameters = {
  chromatic: { 
    disableSnapshot: true, // Disable by default
  },
};

// Enable per story
export const VisualStory: Story = {
  parameters: {
    chromatic: { disableSnapshot: false },
  },
};
```

2. **Group Similar Variants**
```typescript
// Instead of: Default, Small, Medium, Large (4 snapshots)
// Use: All Sizes (1 snapshot with all variants)
export const AllSizes: Story = {
  render: () => (
    <>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </>
  ),
};
```

3. **Delay Expensive Stories**
```typescript
// Mark slow stories
export const ComplexChart: Story = {
  parameters: {
    chromatic: { 
      delay: 1000, // Wait 1s before snapshot
    },
  },
};
```

---

### 3.3 Configure Ignored Elements
**Priority:** LOW

**Use Case:** Ignore dynamic content (timestamps, random IDs)

**Implementation:**
```typescript
// In story parameters
export const WithDynamicContent: Story = {
  parameters: {
    chromatic: {
      // Ignore specific elements
      ignore: ['.timestamp', '[data-testid="random-id"]'],
    },
  },
};
```

---

## Phase 4: Workflow & Best Practices (30 minutes)

### 4.1 Document Review Process
**Priority:** HIGH

**New File:** `docs/chromatic-workflow.md`

**Content:**
```markdown
# Chromatic Visual Regression Workflow

## For Developers

### Making Visual Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/update-button-styles
   ```

2. **Make Changes**
   - Update component styles
   - Update Storybook stories if needed

3. **Run Chromatic Locally** (optional but recommended)
   ```bash
   npm run chromatic
   ```

4. **Push Changes & Create PR**
   - Chromatic runs automatically in CI
   - Review link posted in PR comments

5. **Review Visual Diffs**
   - Click Chromatic link in PR
   - Review each changed story
   - Accept intentional changes
   - Investigate unintended changes

6. **Approve/Request Changes**
   - If all changes intentional: Approve in Chromatic
   - If bugs found: Fix and push new commit
   - New commit triggers new Chromatic build

### Interpreting Results

**Green Check:** No visual changes detected
**Yellow Warning:** Visual changes detected, needs review
**Red X:** Build failed (likely Storybook build error)

### Common Scenarios

**Scenario 1: Intentional Button Color Change**
- ✅ Visual diff shows new color
- ✅ Accept change in Chromatic
- ✅ Becomes new baseline

**Scenario 2: Unintended Modal Positioning Change**
- ❌ Visual diff shows modal moved
- ❌ Investigate: CSS regression? Responsive issue?
- ❌ Fix bug and push new commit

**Scenario 3: Animation Timing Difference**
- ⚠️ Consider disabling animations for that story
- ⚠️ Or increase delay parameter

## For Reviewers

### PR Review Checklist

- [ ] Check Chromatic status in PR
- [ ] Click Chromatic build link
- [ ] Review all "Changed" stories
- [ ] Verify changes match PR description
- [ ] Ensure no unintended regressions
- [ ] Confirm changes are approved in Chromatic
```

---

### 4.2 Create Troubleshooting Guide
**Priority:** MEDIUM

**File:** `docs/chromatic-troubleshooting.md`

**Common Issues:**

1. **False Positives (Font Rendering)**
   - Cause: Anti-aliasing differences
   - Solution: Increase diff threshold or use system fonts

2. **Snapshot Quota Exceeded**
   - Cause: Too many snapshots
   - Solution: Optimize stories, group variants

3. **Slow Builds**
   - Cause: Heavy components (charts, tables)
   - Solution: Add delay parameter, simplify stories

4. **Chromatic Build Fails**
   - Cause: Storybook build error
   - Solution: Fix Storybook locally first

---

### 4.3 Set Up Notifications
**Priority:** LOW

**Options:**

1. **Slack Integration**
   - Connect Chromatic to Slack workspace
   - Get notifications for build status

2. **Email Notifications**
   - Configure in Chromatic settings
   - Notify on build failures only

3. **GitHub Status Checks**
   - Automatic (enabled by default)
   - PR shows Chromatic status

---

## Maintenance & Monitoring

### Weekly Tasks
- [ ] Review snapshot usage in Chromatic dashboard
- [ ] Check for approaching quota limits
- [ ] Review any skipped/ignored stories

### Monthly Tasks
- [ ] Audit snapshot efficiency
- [ ] Update baselines for stale branches
- [ ] Review Chromatic configuration
- [ ] Update documentation if workflow changes

### Quarterly Tasks
- [ ] Evaluate free tier vs paid plan needs
- [ ] Review false positive rate
- [ ] Optimize slow-running stories
- [ ] Update Chromatic package version

---

## Success Criteria

### Immediate (Setup Complete)
- [ ] Chromatic account created
- [ ] Project token configured
- [ ] Baseline snapshots captured for all 47 components
- [ ] CI/CD workflow running on PRs
- [ ] Team trained on review process

### Short-term (1 month)
- [ ] Caught at least 1 visual regression before merge
- [ ] 100% of PRs reviewed in Chromatic
- [ ] <5% false positive rate
- [ ] Staying within free tier quota

### Long-term (3 months)
- [ ] Zero visual regressions in production
- [ ] Team confidently makes styling changes
- [ ] Visual review integrated into normal workflow
- [ ] Documentation complete and accurate

---

## Cost-Benefit Analysis

### Benefits
- **Prevent Visual Bugs:** ~$1,000+ value per bug caught
- **Faster Code Review:** ~15 min saved per PR = ~10 hours/month
- **Designer Confidence:** Non-technical stakeholders can review
- **Documentation:** Visual component history

### Costs
- **Setup Time:** 2-3 hours (one-time)
- **Review Time:** ~5 min per PR (ongoing)
- **Service Cost:** $0/month (free tier) or $149/month (paid)
- **Maintenance:** ~1 hour/month

**ROI:** High - One prevented visual bug justifies cost

---

## Alternative Solutions

### Option 1: Percy (Alternative Service)
- Similar to Chromatic
- Different pricing model
- Comparable features

### Option 2: BackstopJS (Self-Hosted)
- Free and open-source
- Requires more setup
- No cloud dashboard
- Good for privacy-sensitive projects

### Option 3: Manual Visual Testing
- Zero cost
- Time-consuming
- Prone to human error
- Not scalable

**Recommendation:** Chromatic (best balance of features, ease, and cost)

---

## Future Enhancements

### Advanced Features (Post-Initial Setup)
- [ ] Cross-browser testing (Safari, Firefox)
- [ ] Mobile viewport testing
- [ ] Interaction testing (Storybook interactions + Chromatic)
- [ ] Accessibility testing integration
- [ ] Performance testing integration
- [ ] Design token validation

### Integration Ideas
- [ ] Figma plugin for design → Chromatic comparison
- [ ] Automated changelog generation from visual diffs
- [ ] Component usage analytics
- [ ] A/B testing preview

---

## References

- [Chromatic Documentation](https://www.chromatic.com/docs)
- [Storybook + Chromatic Guide](https://storybook.js.org/tutorials/intro-to-storybook/react/en/deploy/)
- [Visual Testing Best Practices](https://www.chromatic.com/blog/visual-testing-best-practices)
- [GitHub Actions Integration](https://www.chromatic.com/docs/github-actions)

---

**Document Version:** 1.0 (Skeleton)  
**Last Updated:** January 19, 2026  
**Status:** Future / Out of Scope  
**Dependencies:** 016-ui-component-standardization.md  
**Maintainer:** Development Team

---

## Quick Start (When Ready to Implement)

```bash
# 1. Install Chromatic
cd frontend
npm install --save-dev chromatic

# 2. Set project token
export CHROMATIC_PROJECT_TOKEN=your-token-here

# 3. Run first build
npm run chromatic

# 4. View results
# Follow link in console output
```

**Estimated Time to First Snapshot:** 15 minutes
