# Git Commit and Push Instructions

## Overview

This document outlines the proper procedures for committing and pushing code changes to the OSRS Grand Exchange Tracker repository. Following these guidelines ensures code quality, maintains clear history, and prevents accidental deployments.

## 🚨 CRITICAL RULE

**NEVER commit or push code without explicit user permission.**

### What This Means

- ❌ **DO NOT** run `git commit` automatically
- ❌ **DO NOT** run `git push` automatically
- ❌ **DO NOT** stage and commit in one step without user approval
- ✅ **DO** stage files with `git add` when preparing changes
- ✅ **DO** show `git status` and `git diff` to preview changes
- ✅ **DO** wait for explicit permission like:
  - "commit and push"
  - "push the changes"
  - "commit this"
  - "go ahead and push"

## Pre-Commit Checklist

Before committing any code, ensure:

### 1. Automated Pre-Commit Hooks ✅

This repository has **pre-commit hooks configured** that automatically run on every commit:

- ✅ **Go linting** (`golangci-lint`) - Automatically runs and fixes issues
- ✅ **Go formatting** (`go fmt`) - Formats code automatically
- ✅ **Go imports** (`goimports`) - Organizes imports automatically
- ✅ **Go mod tidy** - Ensures dependencies are clean
- ✅ **File checks** - Trailing whitespace, YAML/JSON validation, merge conflicts
- ✅ **Markdown linting** - Fixes Markdown formatting issues

**These run automatically when you commit** - no manual action needed!

If the hooks find issues, they will:
1. Attempt to fix them automatically (formatting, whitespace, etc.)
2. Block the commit if there are unfixable issues (linting errors)
3. Show you what needs to be fixed

### 2. Manual Checks (Not Automated)

- [ ] **Tests pass**: All unit tests and integration tests are passing
  ```powershell
  # Backend tests
  cd backend
  go test ./...
  
  # Frontend tests (if changed)
  cd frontend
  npm run test
  ```

- [ ] **Build succeeds**: Project builds without errors (backend only if changed)
  ```powershell
  cd backend
  go build -o bin/api cmd/api/main.go
  ```

- [ ] **Self-review**: Review your own changes for obvious issues
  ```powershell
  git diff --staged
  ```

- [ ] **Coding standards**: Changes follow [backend/CODING_STANDARDS.md](../../backend/CODING_STANDARDS.md)
- [ ] **No debug code**: Remove console.logs, print statements, commented code
- [ ] **No secrets**: Ensure no API keys, passwords, or sensitive data in code

### 3. Documentation

- [ ] **Comments updated**: Code comments reflect actual behavior
- [ ] **README updated**: If public API or features changed
- [ ] **Migration scripts**: Database changes include migration files

### Installing Pre-Commit Hooks

If you haven't installed the pre-commit hooks yet:

```powershell
# Install pre-commit (if not already installed)
pip install pre-commit

# Install the git hooks
pre-commit install

# Optionally, run hooks manually on all files
pre-commit run --all-files
```

Once installed, the hooks will run automatically on every `git commit`.

## Git Workflow

### Step 1: Check Status

Always check what files have changed:

```powershell
git status
```

### Step 2: Review Changes

View the actual diff before staging:

```powershell
# View all changes
git diff

# View specific file
git diff path/to/file.go

# View staged changes
git diff --staged
```

### Step 3: Stage Files

Stage only the files you intend to commit:

```powershell
# Stage specific files
git add backend/internal/services/item_service.go
git add frontend/src/components/ItemTable.tsx

# Stage all files in a directory
git add backend/internal/services/

# Stage all changes (use with caution)
git add .
```

**⚠️ Avoid staging unrelated changes in the same commit**

### Step 4: Verify Staged Changes

Double-check what will be committed:

```powershell
git diff --staged
```

### Step 5: Commit (WITH USER PERMISSION)

**🚨 WAIT FOR USER APPROVAL BEFORE THIS STEP**

Write a clear, descriptive commit message following [Conventional Commits](https://www.conventionalcommits.org/):

```powershell
git commit -m "type(scope): description"
```

**Note**: Pre-commit hooks will run automatically at this stage:
- If hooks fix issues (formatting, whitespace), files will be re-staged automatically
- If hooks find unfixable issues (linting errors), the commit will be blocked
- Review any hook output and fix reported issues before committing again

#### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvement
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `build`: Build system or external dependencies
- `ci`: CI/CD configuration changes

**Scopes:**
- `backend`: Backend Go code
- `frontend`: Frontend React code
- `api`: API endpoints
- `database`: Database schema or queries
- `docker`: Docker configuration
- `config`: Configuration files
- `deps`: Dependencies

**Examples:**

```powershell
# Feature addition
git commit -m "feat(backend): add bulk price update endpoint"

# Bug fix
git commit -m "fix(frontend): correct price chart time range selector"

# Refactoring
git commit -m "refactor(backend): rename cfg to dbConfig in database package"

# Performance improvement
git commit -m "perf(backend): add Redis caching for item queries"

# Documentation
git commit -m "docs: update API endpoint documentation in README"

# Multi-line commit with body
git commit -m "feat(backend): implement SSE for real-time price updates

- Add SSE hub service for managing client connections
- Add SSE handler with heartbeat support
- Configure SSE routes in main.go
- Add tests for SSE functionality

Closes #42"
```

### Step 6: Push (WITH USER PERMISSION)

**🚨 WAIT FOR USER APPROVAL BEFORE THIS STEP**

Push your commits to the remote repository:

```powershell
# Push to current branch
git push

# Push to specific branch
git push origin feature/add-sse-support

# Force push (use with extreme caution)
git push --force-with-lease
```

## Branch Strategy

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch for features

### Feature Branches

Create feature branches from `develop`:

```powershell
# Create and switch to new branch
git checkout -b feature/description

# Examples
git checkout -b feature/add-sse-support
git checkout -b fix/price-cache-invalidation
git checkout -b refactor/config-naming
```

### Branch Naming Convention

```
<type>/<description>
```

**Types:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `hotfix/` - Urgent production fixes
- `docs/` - Documentation updates
- `test/` - Test additions or updates

**Examples:**
- `feature/real-time-price-updates`
- `fix/redis-connection-timeout`
- `refactor/repository-interfaces`
- `hotfix/critical-cache-bug`

## Common Scenarios

### Scenario 1: Adding a New Feature

```powershell
# 1. Create feature branch
git checkout -b feature/add-volume-tracking

# 2. Make changes and test
# ... make code changes ...
go test ./...

# 3. Review changes
git status
git diff

# 4. Stage changes
git add backend/internal/models/price.go
git add backend/internal/services/price_service.go

# 5. Check staged changes
git diff -- (pre-commit hooks run automatically here)
git commit -m "feat(backend): add volume tracking to price model"
# Pre-commit hooks will run: linting, formatting, etc.
# If any issues found, fix them and commit again
# 6. WAIT FOR USER APPROVAL
# User says: "commit and push"

# 7. Commit
git commit -m "feat(backend): add volume tracking to price model"

# 8. Push
git push origin feature/add-volume-tracking
```

### Scenario 2: Fixing a Bug

```powershell
# 1. Create fix branch
git checkout -b fix/cache-expiration

# 2. Make fix and test
# ... fix code ...
go test ./tests/unit/cache_service_test.go

# 3. Review and stage
git diff
git add backend/internal/services/cache_service.go
git add backend/tests/unit/cache_service_test.go

# 4. WAIT FOR USER APPROVAL

# 5. Commit
git commit -m "fix(backend): correct cache TTL calculation

Previous implementation used seconds instead of milliseconds,
causing cache entries to expire too quickly.

Fixes #123"

# 6. Push
git push origin fix/cache-expiration
```

### Scenario 3: Multiple Related Changes

```powershell
# 1. Make all related changes
# ... implement feature across multiple files ...

# 2. Review all changes
git status
git diff

# 3. Stage files logically (one commit per logical unit)
git add backend/internal/handlers/sse_handler.go
git add backend/internal/services/sse_hub.go

# 4. WAIT FOR USER APPROVAL

# 5. First commit (core functionality)
git commit -m "feat(backend): add SSE hub and handler"

# 6. Stage next logical group
git add backend/cmd/api/main.go
git add backend/internal/config/config.go

# 7. WAIT FOR USER APPROVAL

# 8. Second commit (configuration)
git commit -m "feat(backend): configure SSE routes and settings"

# 9. WAIT FOR USER APPROVAL

# 10. Push all commits
git push origin feature/add-sse-support
```

### Scenario 4: Amending Last Commit

If you forgot something in your last commit (before pushing):

```powershell
# Make additional changes
git add forgotten-file.go

# WAIT FOR USER APPROVAL

# Amend the last commit
git commit --amend --no-edit

# Or amend with new message
git commit --amend -m "feat(backend): add SSE support with tests"
```

**⚠️ Never amend commits that have been pushed to shared branches**

### Scenario 5: Unstaging Files

If you staged files by mistake:

```powershell
# Unstage specific file
git reset HEAD path/to/file.go

# Unstage all files
git reset HEAD
```

## What NOT to Commit

### Temporary Files

- Build artifacts: `bin/`, `dist/`, `build/`
- Dependency directories: `node_modules/`, `vendor/`
- Coverage reports: `coverage/`, `*.out`
- IDE files: `.vscode/`, `.idea/` (unless project-specific)
- OS files: `.DS_Store`, `Thumbs.db`

### Sensitive Information

- Environment files with secrets: `.env` (use `.env.example` instead)
- API keys, passwords, tokens
- Private keys, certificates
- Personal configuration files

### Generated Files

- Compiled binaries: `*.exe`, `*.so`, `*.dylib`
- Minified assets (unless part of build)
- Auto-generated documentation
- Lock files (depends on project policy)

## Git Best Practices

### 1. Commit Often, Push Less

- Make small, focused commits locally
- Push to remote when a logical feature/fix is complete
- Each commit should be a working state

### 2. Write Meaningful Commit Messages

```powershell
# ❌ BAD
git commit -m "fix stuff"
git commit -m "update"
git commit -m "wip"

# ✅ GOOD
git commit -m "fix(backend): resolve race condition in cache service"
git commit -m "refactor(backend): rename cfg to dbConfig for clarity"
git commit -m "feat(frontend): add price chart zoom functionality"
```

### 3. Keep Commits Atomic

Each commit should represent one logical change:

```powershell
# ❌ BAD - Multiple unrelated changes
git add backend/internal/services/item_service.go
git add frontend/src/components/Header.tsx
git add README.md
git commit -m "various updates"

# ✅ GOOD - One logical change per commit
git add backend/internal/services/item_service.go
git commit -m "refactor(backend): optimize item query performance"

git add frontend/src/components/Header.tsx
git commit -m "style(frontend): update header responsive layout"

git add README.md
git commit -m "docs: update API endpoint documentation"
```

### 4. Review Before Committing

Always review your changes:

```powershell
# Full diff
git diff

# Staged diff (what will be committed)
git diff --staged

# Summary of changes
git status -s
```

### 5. Use .gitignore Effectively

Ensure `.gitignore` is properly configured:

```gitignore
# Backend
bin/
*.out
coverage/
.env

# Frontend
node_modules/
dist/
.env.local

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db
```

## Rollback Procedures

### Undo Last Commit (Not Pushed)

```powershell
# Keep changes in working directory
git reset --soft HEAD~1

# Discard changes completely
git reset --hard HEAD~1
```

### Revert Pushed Commit

```powershell
# WAIT FOR USER APPROVAL

# Create a new commit that undoes changes
git revert <commit-hash>
git push
```

### Discard Local Changes

```powershell
# Discard changes in specific file
git checkout -- path/to/file.go

# Discard all local changes
git reset --hard HEAD
```

## Troubleshooting

### Merge Conflicts

```powershell
# 1. Identify conflicted files
git status

# 2. Open and resolve conflicts manually
# Look for <<<<<<, ======, >>>>>> markers

# 3. Mark as resolved
git add resolved-file.go

# 4. WAIT FOR USER APPROVAL

# 5. Complete merge
git commit
```

### Accidentally Committed to Wrong Branch

```powershell
# 1. Create correct branch (stays on current branch)
git branch correct-branch

# 2. Reset current branch (removes commit)
git reset --hard HEAD~1

# 3. Switch to correct branch
git checkout correct-branch
```

### Push Rejected (Non-Fast-Forward)

```powershell
# 1. Fetch latest changes
git fetch origin

# 2. Rebase your changes
git rebase origin/main

# 3. Resolve conflicts if any

# 4. WAIT FOR USER APPROVAL

# 5. Push
git push origin main
```

## Quick Reference

### Essential Commands

```powershell
# Status and info
git status                    # Show working tree status
git log --oneline -10         # Show last 10 commits
git diff                      # Show unstaged changes
git diff --staged             # Show staged changes

# Staging
git add <file>                # Stage specific file
git add .                     # Stage all changes
git reset HEAD <file>         # Unstage file

# Committing (REQUIRES USER APPROVAL)
git commit -m "message"       # Commit with message
git commit --amend            # Amend last commit

# Pushing (REQUIRES USER APPROVAL)
git push                      # Push to remote
git push origin <branch>      # Push specific branch

# Branches
git branch                    # List local branches
git checkout -b <branch>      # Create and switch to branch
git checkout <branch>         # Switch to branch
git branch -d <branch>        # Delete branch

# Undoing
git reset --soft HEAD~1       # Undo last commit, keep changes
git reset --hard HEAD~1       # Undo last commit, discard changes
git checkout -- <file>        # Discard changes in file
```

## AI Assistant Workflow

When working as an AI assistant:

1. **Make changes** and verify they work
**Note**: Pre-commit hooks will run automatically during the commit step. If they fail:
- Review the hook output for errors
- Fix any reported issues
- Re-stage the fixed files
- Attempt commit again

### Example Interaction

```
AI: I've implemented the SSE feature and all tests are passing. 
    The following files have been staged:
    
    - backend/internal/handlers/sse_handler.go
    - backend/internal/services/sse_hub.go
    - backend/cmd/api/main.go
    
    Would you like me to commit and push these changes?

User: Yes, commit and push

AI: [Runs git commit - pre-commit hooks run automatically]
    ✅ Pre-commit hooks passed (linting, formatting, etc.)
    ✅ Committed with message "feat(backend): add SSE support for real-time updates"
    ✅ Pushed to origin/feature/add-sse-support
```

### If Pre-Commit Hooks Fail

```
AI: [Runs git commit - pre-commit hooks run]
    ❌ Pre-commit hooks failed:
       - golangci-lint found 2 issues in sse_handler.go
       - Unused variable 'ctx' on line 45
       - Error not checked on line 78
    
    I'll fix these issues and try again.
    
    [Fixes issues, re-stages files]
    
    ✅ Pre-commit hooks passede_hub.go
    - backend/cmd/api/main.go
    
    Would you like me to commit and push these changes?

User: Yes, commit and push

AI: [Runs git commit and git push]
    ✅ Committed with message "feat(backend): add SSE support for real-time updates"
    ✅ Pushed to origin/feature/add-sse-support
```

---

**Document Version**: 1.0  
**Last Updated**: January 17, 2026  
**Related**: [copilot-instructions.md](../copilot-instructions.md), [CODING_STANDARDS.md](../../backend/CODING_STANDARDS.md)
