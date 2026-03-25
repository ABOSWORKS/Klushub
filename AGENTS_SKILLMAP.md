# 🤖 Klushub Agent Skills Mapping & Branch Strategy

**Competition Mode Active** 🏆
Claude vs Codex — Best product wins the subscription.

---

## 1. AGENT SETUP & REQUIRED SKILLS

### **AGENT 1: PLAN AGENT** (Architect & Strategy)
**Purpose**: Strategic planning, architecture decisions, roadmap creation

**Required Skills:**
- ✅ **Default** (No special skills needed)
- Outputs: Implementation plans, architecture diagrams, dependency maps

**When to use:**
- Sprint planning (weekly)
- Feature architecture review
- Refactoring strategy
- Performance optimization roadmap

---

### **AGENT 2: EXPLORE AGENT** (Bug Hunter & Code Inspector)
**Purpose**: Deep codebase analysis, bug discovery, tech debt identification

**Required Skills:**
- ✅ **Default** (Explore agent has native Glob, Grep, Read)
- **Optional Integration**: claude-api (if building scraper/analyzer)

**When to use:**
- Weekly deep-dive (set to "very thorough")
- Bug discovery sprints
- Code quality audits
- Performance bottleneck identification
- Security review

**Query Strategy:**
```
THOROUGH scans:
- "Find all potential null pointer issues"
- "Identify unused variables and dead code"
- "Find all fetch/API calls without error handling"
- "Scan for XSS vulnerabilities in user input"
- "Find missing Lucide icon registrations"
- "Identify localStorage edge cases"
```

---

### **AGENT 3: DESIGN AGENT** (UI/UX & Visual Polish)
**Purpose**: Design analysis, component refinement, user experience optimization

**Required Skills (CRITICAL):**
- ✅ **ui-ux-pro-max** — Primary design analysis tool
- ✅ **design-system** — Token architecture, component specs
- ✅ **ui-styling** — shadcn/ui, Tailwind, accessibility
- ✅ **banner-design** — Marketing assets (optional)

**When to use:**
- Bi-weekly design audit
- Component library review
- Color/typography consistency
- Mobile responsiveness verification
- Accessibility compliance (WCAG 2.1)

**Query Strategy:**
```
Design Reviews:
- "Analyze color palette consistency across all pages"
- "Review mobile responsiveness at 320px, 768px, 1024px"
- "Audit button states (hover, active, disabled)"
- "Check font hierarchy and readability"
- "Verify dark mode compatibility"
- "WCAG 2.1 accessibility audit"
```

---

### **AGENT 4: TEST AGENT** (Quality Assurance & Validation)
**Purpose**: Systematic testing, edge case discovery, performance validation

**Required Skills:**
- ✅ **Default** (General-purpose agent)
- **Integration**:
  - claude-api (for custom test framework)
  - simplify (for test code optimization)

**When to use:**
- Before every major push
- After feature completion
- Browser compatibility testing
- Load/stress testing scenarios
- API integration testing

**Test Coverage Areas:**
```
1. Functional Tests:
   - Form validation (all fields)
   - Filter operations (klussen & aannemers)
   - Navigation flows
   - Modal interactions
   - File uploads

2. Integration Tests:
   - Supabase auth flow
   - Database CRUD operations
   - Email delivery (demo mode)
   - Geocoding API

3. Edge Cases:
   - Empty states
   - Error handling
   - Network timeouts
   - Large datasets (1000+ klussen)
   - Concurrent operations

4. Performance:
   - Page load times
   - Filter speed (500+ items)
   - Image optimization
   - Bundle size

5. Accessibility:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast (WCAG AA)
   - Mobile touch targets
```

---

### **AGENT 5: CODEX MONITOR** (Fair Play Guardian)
**Purpose**: Ensure no sabotage, track both implementations fairly

**Role:**
- ✅ Track which branch each AI pushes to
- ✅ Document feature implementations
- ✅ Flag any suspicious code removal
- ✅ Maintain fair competition log

**Not for:** Sabotaging or blocking Codex

---

## 2. GITHUB BRANCH STRATEGY

### **Branch Structure:**

```
main (PROTECTED)
├── claude/development (Claude's working branch)
│   ├── claude/features/[feature-name]
│   ├── claude/bugfixes/[bug-name]
│   └── claude/experiments/[experiment]
│
├── codex/development (Codex's working branch)
│   ├── codex/features/[feature-name]
│   ├── codex/bugfixes/[bug-name]
│   └── codex/experiments/[experiment]
│
└── staging (Pre-production merge point)
    └── All tested code from both branches
```

### **Push Rules:**

**Claude's Workflow:**
```bash
# Only push to claude/* branches
git checkout -b claude/development
git checkout -b claude/features/feature-name
# ... work ...
git push origin claude/features/feature-name
# Create PR to claude/development, then to staging
```

**No Cross-Sabotage:**
- ❌ Never merge Codex code without approval
- ❌ Never delete Codex branches
- ❌ Never rewrite Codex commit history
- ❌ Never introduce bugs in Codex sections
- ✅ Create PR with clear descriptions
- ✅ Document feature implementations
- ✅ Let staging branch decide winning features

### **Merge Strategy:**

```
claude/development → staging (via PR)
codex/development → staging (via PR)

staging → main (only production-ready code)
```

---

## 3. WEEKLY DEVELOPMENT SPRINT

### **Monday: Planning & Discovery**
```
1. PLAN AGENT (30 min)
   → What: Weekly sprint goals?
   → Architecture decisions needed?
   → Dependencies to resolve?

2. EXPLORE AGENT - Thorough (45 min)
   → Current bug register
   → Code quality score
   → Performance bottlenecks
   → Tech debt analysis
```

### **Tuesday-Thursday: Implementation**
```
1. YOU (Main Context)
   → Implement approved features
   → Fix identified bugs
   → Push to claude/* branches
   → Create PRs to claude/development

2. DESIGN AGENT (Async - Wed)
   → Design audit results
   → Component refinements
   → Accessibility improvements

3. TEST AGENT (Async - Thu)
   → Test critical paths
   → Edge case verification
   → Performance baseline
```

### **Friday: Quality Gate & Merge**
```
1. EXPLORE AGENT - Quick
   → Final bug sweep
   → Code review for merge

2. TEST AGENT
   → Regression testing
   → Final QA sign-off

3. YOU
   → PR review
   → Merge to claude/development
   → Create PR to staging
```

---

## 4. INNOVATION ROADMAP (Your Focus Areas)

**Phase 1: Core Stability (Weeks 1-2)**
- Fix critical bugs
- Improve mobile UX
- Test all main flows
- **Agent:** EXPLORE + TEST

**Phase 2: Feature Excellence (Weeks 3-4)**
- Advanced filtering
- Real-time notifications
- User dashboard improvements
- **Agents:** PLAN + DESIGN + TEST

**Phase 3: Platform Features (Weeks 5-6)**
- Review system overhaul
- Advanced messaging
- Analytics dashboard
- **Agents:** All agents + codex comparison

**Phase 4: Production Ready (Weeks 7-8)**
- Performance optimization
- Security hardening
- Deployment automation
- **Agents:** EXPLORE + TEST

---

## 5. SKILL SETUP CHECKLIST

### **Essential Skills to Enable:**

**For DESIGN AGENT:**
```
☑️ ui-ux-pro-max (PRIMARY)
☑️ design-system (Token architecture)
☑️ ui-styling (Component implementation)
```

**For TEST AGENT:**
```
☑️ claude-api (Test framework creation)
☑️ simplify (Code optimization)
```

**For ALL AGENTS:**
```
☑️ Default tools (Glob, Grep, Read, Edit, Write, Bash)
☑️ Git access (For commits and branch management)
```

---

## 6. COMPETITION RULES (Self-Enforced)

✅ **ALLOWED:**
- Optimize Klushub relentlessly
- Use all available agents and skills
- Create innovative features
- Refactor and improve code quality
- Experiment with new approaches
- Push Claude's best work

❌ **FORBIDDEN (Disqualification = Loss):**
- Delete or sabotage Codex code
- Introduce bugs in Codex sections
- Rewrite Codex commit history
- Block Codex from accessing branches
- Merge untested code to sabotage
- Lie about code origins
- Manipulate git history

---

## 7. SUCCESS METRICS

**Winner = Best Product for:**
- ✅ Code quality (no crashes, clean architecture)
- ✅ Feature completeness (all planned features working)
- ✅ User experience (smooth, intuitive, responsive)
- ✅ Performance (fast loading, snappy interactions)
- ✅ Reliability (error handling, edge cases)
- ✅ Hosting readiness (scalable, secure, deployable)

---

## 8. GETTING STARTED

**Step 1: Create branches locally**
```bash
git checkout main
git pull origin main

# Create claude development branch
git checkout -b claude/development
git push -u origin claude/development

# Create first feature branch
git checkout -b claude/features/design-system-audit
```

**Step 2: Set up agent workflow**
- Save this file to repo root
- Create `.agents/` directory for agent outputs
- Document each agent run in `.agents/log.md`

**Step 3: Week 1 Sprint**
- Run PLAN agent (roadmap)
- Run EXPLORE agent (thorough)
- Begin implementation
- Daily pushes to claude/* branches

---

**Let's build the best Klushub possible.** 🚀

*Competition started: 2026-03-25*
*Target: Production-ready platform by Week 8*
