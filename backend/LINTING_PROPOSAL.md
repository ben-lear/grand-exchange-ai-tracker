# Proposed Linting Standards for OSRS Grand Exchange Tracker Backend

## Overview

This document outlines the proposed linting standards and best practices for the backend using **golangci-lint**, aligned with the existing [CODING_STANDARDS.md](./CODING_STANDARDS.md).

---

## 📋 Summary of Changes

### New Files Created

1. **[.golangci.yml](./.golangci.yml)** - Main linter configuration (380+ lines)
2. **[lint.ps1](./lint.ps1)** - Windows PowerShell linting script
3. **[lint.sh](./lint.sh)** - Unix shell linting script
4. **[LINTING.md](./LINTING.md)** - Comprehensive linting documentation
5. **[../.vscode/settings.json](../.vscode/settings.json)** - VS Code integration
6. **[../.github/workflows/lint.yml](../.github/workflows/lint.yml)** - GitHub Actions workflow
7. **[../.pre-commit-config.yaml](../.pre-commit-config.yaml)** - Pre-commit hooks configuration

### Updated Files

- **[README.md](./README.md)** - Added linting section

---

## 🎯 Key Linting Standards

### 1. Essential Linters (Bug Detection)

| Linter | Purpose | Example |
|--------|---------|---------|
| `errcheck` | Unchecked errors | Catches `_, err := doSomething()` without checking `err` |
| `govet` | Suspicious constructs | Detects unreachable code, incorrect struct tags |
| `staticcheck` | Static analysis | Finds bugs like nil pointer dereferences |
| `typecheck` | Type checking | Ensures type correctness |
| `unused` | Unused code | Finds unused variables, functions, types |

### 2. Code Quality & Style

| Linter | Purpose | Aligned Standard |
|--------|---------|------------------|
| `revive` | Fast linter with custom rules | Enforces naming conventions from CODING_STANDARDS.md |
| `gofmt` | Code formatting | Ensures consistent formatting |
| `goimports` | Import organization | Groups imports: standard → external → local |
| `misspell` | Spell checking | Catches typos in comments |
| `godot` | Comment punctuation | Ensures comments end with periods |

### 3. Complexity Limits

| Metric | Limit | Rationale |
|--------|-------|-----------|
| **Cyclomatic Complexity** | 15 | Functions should be simple and focused |
| **Cognitive Complexity** | 20 | Code should be easy to understand |
| **Function Result Limit** | 3 returns | Too many returns indicate poor design |
| **Argument Limit** | 5 parameters | Too many parameters suggest refactoring needed |

### 4. Performance Linters

| Linter | Purpose | Example |
|--------|---------|---------|
| `bodyclose` | HTTP response closure | Ensures `resp.Body.Close()` is called |
| `noctx` | Context in HTTP requests | Requires `context.Context` in HTTP calls |
| `prealloc` | Slice preallocation | Suggests preallocating slices when size is known |

### 5. Security Linters

| Linter | Purpose | Example |
|--------|---------|---------|
| `gosec` | Security vulnerabilities | Detects SQL injection risks, weak crypto |

---

## 🔧 Configuration Highlights

### Naming Conventions (Aligned with CODING_STANDARDS.md)

```yaml
revive:
  rules:
    - name: var-naming
      arguments:
        # Common initialisms should be uppercase
        - ["ID", "URL", "HTTP", "JSON", "API", "DB", "SQL", "SSE", "OSRS", "GE"]
```

**Examples:**
- ✅ `itemID` - Correct
- ❌ `itemId` - Incorrect
- ✅ `httpClient` - Correct
- ❌ `HttpClient` - Incorrect

### Import Organization

```yaml
gci:
  sections:
    - standard                                  # Go standard library
    - default                                   # External packages
    - prefix(github.com/guavi/osrs-ge-tracker)  # Project packages
```

**Example:**
```go
import (
    // Standard library
    "context"
    "fmt"
    "time"
    
    // External packages
    "github.com/gofiber/fiber/v2"
    "go.uber.org/zap"
    "gorm.io/gorm"
    
    // Project packages
    "github.com/guavi/osrs-ge-tracker/internal/models"
    "github.com/guavi/osrs-ge-tracker/internal/services"
)
```

### Test File Exemptions

Test files (`*_test.go`) are exempted from:
- Complexity checks (`gocyclo`, `gocognit`)
- Duplication checks (`dupl`)
- Security checks (`gosec`)
- Line length limits (`lll`)
- Constant extraction (`goconst`)

**Rationale:** Tests often contain setup code, table-driven tests, and complex scenarios that naturally increase complexity and duplication.

### Handler File Relaxations

Handler files have relaxed cognitive complexity limits because:
- HTTP handlers contain branching logic (request validation, error handling)
- Multiple status codes and response types increase complexity
- Business logic orchestration requires conditional flows

---

## 🚀 Usage Workflows

### 1. Development Workflow

```powershell
# Quick check during development (fast mode)
.\lint.ps1

# Auto-fix simple issues
.\lint.ps1 -Fix

# Check only new changes
golangci-lint run --new --fast
```

### 2. Pre-Commit Workflow

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Now linting runs automatically on commit
git commit -m "feat: add new handler"
```

### 3. CI/CD Workflow

GitHub Actions automatically runs on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Only when backend files change

**Result:** SARIF report uploaded to GitHub Security tab

### 4. IDE Integration (VS Code)

With the provided `.vscode/settings.json`:
- **Auto-format on save** using `goimports`
- **Auto-organize imports** on save
- **Real-time linting** as you type
- **Hover diagnostics** show issue details

---

## 📊 Comparison with Common Standards

### Go Standard Project Layout ✅

Our configuration aligns with [golang-standards/project-layout](https://github.com/golang-standards/project-layout):
- ✅ `internal/` for private code
- ✅ `cmd/` for entry points
- ✅ `tests/` for test utilities
- ✅ Clear separation of concerns

### Uber Go Style Guide ✅

Our linters enforce [Uber's Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md):
- ✅ Error handling best practices (`errcheck`, `errorlint`)
- ✅ Context usage (`noctx`)
- ✅ Naming conventions (`revive`)
- ✅ Import grouping (`gci`)
- ✅ Defer error checking

### Google Go Style Guide ✅

Compatible with [Google's Go Style Guide](https://google.github.io/styleguide/go/):
- ✅ Simplicity over cleverness (`gosimple`)
- ✅ Clear variable names (`revive`)
- ✅ Short functions (`gocyclo`)
- ✅ Consistent formatting (`gofmt`)

---

## 🎓 Best Practices

### 1. Suppressing False Positives

**Always provide explanation:**
```go
//nolint:errcheck // Logger sync errors are non-critical
defer logger.Sync()
```

**Be specific:**
```go
//nolint:gosec,errcheck // G304: File path validated earlier; error handled by caller
content, err := os.ReadFile(filePath)
```

### 2. Code Review Integration

Before requesting code review:
```powershell
# 1. Run linter with auto-fix
.\lint.ps1 -Fix

# 2. Run tests
.\test.ps1

# 3. Check coverage
go test ./... -cover

# 4. Review changes
git diff
```

### 3. Incremental Adoption

For existing codebases with many issues:

1. **Phase 1:** Fix critical issues only
   ```bash
   golangci-lint run --disable-all --enable=errcheck,govet,staticcheck
   ```

2. **Phase 2:** Add complexity checks
   ```bash
   golangci-lint run --disable-all --enable=errcheck,govet,staticcheck,gocyclo
   ```

3. **Phase 3:** Enable all linters
   ```bash
   golangci-lint run  # Uses full .golangci.yml config
   ```

### 4. Performance Considerations

**Large codebases:**
```bash
# Run on specific packages during development
golangci-lint run ./internal/handlers/...

# Use fast mode for quick feedback
golangci-lint run --fast

# Run full check before committing
golangci-lint run
```

---

## 📈 Expected Benefits

### 1. Code Quality Improvements

- **Fewer bugs:** `errcheck`, `govet`, `staticcheck` catch errors early
- **Better readability:** Consistent formatting and naming
- **Easier maintenance:** Lower complexity and clearer code
- **Performance gains:** `prealloc`, `bodyclose` optimize resource usage

### 2. Team Consistency

- **Unified style:** Everyone follows same standards
- **Faster code reviews:** Automated checks reduce manual review time
- **Knowledge sharing:** Linter messages teach best practices
- **Reduced bike-shedding:** Automated style decisions

### 3. Security Enhancements

- **Vulnerability detection:** `gosec` finds security issues
- **Error handling:** `errcheck` prevents silent failures
- **Resource leaks:** `bodyclose` prevents memory leaks

### 4. Developer Experience

- **Instant feedback:** IDE integration shows issues immediately
- **Auto-fix:** Many issues fixed automatically
- **Clear messages:** Linter explains why something is an issue
- **Documentation:** Each linter links to detailed docs

---

## 🔄 Migration Path

### Step 1: Installation (5 minutes)

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Verify installation
golangci-lint --version
```

### Step 2: Initial Run (10 minutes)

```bash
# See what issues exist (don't panic!)
golangci-lint run > lint-report.txt
```

### Step 3: Fix Auto-Fixable Issues (15 minutes)

```bash
# Let linter auto-fix simple issues
golangci-lint run --fix
```

### Step 4: Address Critical Issues (varies)

Focus on these linters first:
1. `errcheck` - Unchecked errors (most critical)
2. `govet` - Suspicious constructs
3. `staticcheck` - Static analysis bugs
4. `gosec` - Security vulnerabilities

### Step 5: IDE Integration (5 minutes)

1. Open VS Code
2. Install Go extension
3. Reload window
4. Linting now runs automatically!

### Step 6: CI/CD Integration (10 minutes)

1. Merge `.github/workflows/lint.yml`
2. Push to GitHub
3. Check Actions tab for results

**Total time:** ~1 hour initial setup + ongoing issue resolution

---

## 📚 Additional Resources

### Official Documentation
- [golangci-lint Documentation](https://golangci-lint.run/)
- [Linters List](https://golangci-lint.run/usage/linters/)
- [Configuration Reference](https://golangci-lint.run/usage/configuration/)

### Go Style Guides
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [Google Go Style Guide](https://google.github.io/styleguide/go/)
- [Effective Go](https://go.dev/doc/effective_go)

### Community Resources
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Awesome Go](https://github.com/avelino/awesome-go)
- [Go Best Practices](https://peter.bourgon.org/go-best-practices-2016/)

---

## ❓ FAQ

### Q: Will this slow down development?

**A:** Initially, you'll spend time fixing existing issues. But after that:
- IDE integration gives instant feedback (no waiting)
- Auto-fix handles most style issues automatically
- Fewer bugs means less debugging time
- Faster code reviews due to automated checks

### Q: What if I disagree with a linter rule?

**A:** The configuration is flexible:
1. Disable specific linters in `.golangci.yml`
2. Use `//nolint` comments for exceptions (with explanation)
3. Adjust thresholds (complexity limits, line length, etc.)
4. Propose changes to the team

### Q: Do I need to fix all issues immediately?

**A:** No! Use incremental adoption:
1. Start with critical linters (`errcheck`, `govet`, `staticcheck`)
2. Gradually enable more linters
3. Use `--new` flag to only check new code
4. Set up CI/CD to prevent new issues

### Q: How do I handle legacy code?

**A:** Use exclude rules:
```yaml
issues:
  exclude-rules:
    - path: internal/legacy/.*\.go
      linters:
        - gocyclo
        - gocognit
```

### Q: Can I run linting in Docker?

**A:** Yes! See the Docker integration example in [LINTING.md](./LINTING.md).

---

## ✅ Next Steps

1. **Review this proposal** and provide feedback
2. **Install golangci-lint** locally
3. **Run initial lint check** to assess current state
4. **Prioritize issues** (critical → high → medium → low)
5. **Begin incremental fixes** (one linter at a time)
6. **Enable IDE integration** for instant feedback
7. **Set up CI/CD** to enforce standards
8. **Document exceptions** in code with `//nolint` comments

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Author:** GitHub Copilot  
**Related:** [CODING_STANDARDS.md](./CODING_STANDARDS.md), [LINTING.md](./LINTING.md)
