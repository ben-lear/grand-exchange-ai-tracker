# golangci-lint Integration Guide

This document explains how to use golangci-lint in the OSRS Grand Exchange Tracker backend project.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Running Linter](#running-linter)
4. [IDE Integration](#ide-integration)
5. [CI/CD Integration](#cicd-integration)
6. [Linter Details](#linter-details)
7. [Suppressing False Positives](#suppressing-false-positives)

---

## Installation

### Using Go

```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### Using Package Managers

**Windows (Scoop):**
```powershell
scoop install golangci-lint
```

**Windows (Chocolatey):**
```powershell
choco install golangci-lint
```

**macOS (Homebrew):**
```bash
brew install golangci-lint
```

**Linux:**
```bash
# Binary installation
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
```

**Verify Installation:**
```bash
golangci-lint --version
```

---

## Configuration

The linter configuration is defined in [.golangci.yml](./.golangci.yml).

### Key Configuration Highlights

- **Go Version:** 1.24.0
- **Timeout:** 5 minutes
- **Line Length Limit:** 120 characters
- **Cyclomatic Complexity Limit:** 15
- **Cognitive Complexity Limit:** 20

### Enabled Linters

#### Essential (Bug Detection & Correctness)
- `errcheck` - Unchecked errors
- `gosimple` - Code simplification
- `govet` - Suspicious constructs
- `ineffassign` - Ineffectual assignments
- `staticcheck` - Static analysis
- `typecheck` - Type checking
- `unused` - Unused code

#### Code Quality & Style
- `revive` - Fast, configurable linter (aligned with CODING_STANDARDS.md)
- `gofmt` - Code formatting
- `goimports` - Import formatting
- `misspell` - Spell checking
- `godot` - Comment punctuation

#### Complexity
- `gocyclo` - Cyclomatic complexity
- `gocognit` - Cognitive complexity

#### Performance
- `bodyclose` - HTTP response body closure
- `noctx` - HTTP requests without context
- `prealloc` - Slice preallocation

#### Security
- `gosec` - Security vulnerabilities

#### Best Practices
- `gocritic` - Diagnostics for bugs, performance, and style
- `nolintlint` - Proper nolint directives
- `exportloopref` - Loop variable references
- `goconst` - Repeated strings that could be constants
- `errorlint` - Error handling misuses

---

## Running Linter

### Using Scripts

**Windows (PowerShell):**
```powershell
# Run linter
.\lint.ps1

# Run with auto-fix
.\lint.ps1 -Fix

# Run with verbose output
.\lint.ps1 -Verbose

# Combine options
.\lint.ps1 -Fix -Verbose
```

**Unix (Linux/macOS):**
```bash
# Run linter
./lint.sh

# Run with auto-fix
./lint.sh --fix

# Run with verbose output
./lint.sh --verbose

# Combine options
./lint.sh --fix --verbose
```

### Direct Commands

```bash
# Run all linters
golangci-lint run

# Run with auto-fix
golangci-lint run --fix

# Run specific linters
golangci-lint run --disable-all --enable=errcheck,govet

# Run on specific files/directories
golangci-lint run ./internal/handlers/...

# Show only new issues (since last commit)
golangci-lint run --new

# Generate report in different formats
golangci-lint run --out-format=json > lint-report.json
golangci-lint run --out-format=checkstyle > lint-report.xml
```

---

## IDE Integration

### Visual Studio Code

1. **Install Extension:**
   - Install "Go" extension by Go Team at Google (ID: `golang.go`)

2. **Enable golangci-lint in VS Code:**

   Add to `.vscode/settings.json`:

   ```json
   {
     "go.lintTool": "golangci-lint",
     "go.lintFlags": [
       "--fast",
       "--config=${workspaceFolder}/backend/.golangci.yml"
     ],
     "go.lintOnSave": "workspace",
     "go.formatTool": "goimports",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.organizeImports": true
     },
     "[go]": {
       "editor.defaultFormatter": "golang.go",
       "editor.formatOnSave": true
     }
   }
   ```

3. **Restart VS Code or reload window**

### GoLand / IntelliJ IDEA

1. Go to **Settings → Tools → Go Linter**
2. Select `golangci-lint` as the linter
3. Set configuration file path: `backend/.golangci.yml`
4. Enable "Run on save"

### Vim/Neovim (with vim-go)

Add to `.vimrc` or `init.vim`:

```vim
let g:go_metalinter_command='golangci-lint'
let g:go_metalinter_autosave=1
let g:go_metalinter_autosave_enabled=['golangci-lint']
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/lint.yml`:

```yaml
name: Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  golangci:
    name: golangci-lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-go@v5
        with:
          go-version: '1.24.0'
          cache: false
      
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: latest
          working-directory: backend
          args: --timeout=5m --config=.golangci.yml
          
      - name: Upload lint results
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: backend/golangci-lint.sarif
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
lint:
  stage: test
  image: golangci/golangci-lint:latest
  script:
    - cd backend
    - golangci-lint run --config .golangci.yml --out-format=code-climate > gl-code-quality-report.json
  artifacts:
    reports:
      codequality: backend/gl-code-quality-report.json
    paths:
      - backend/gl-code-quality-report.json
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running golangci-lint..."

cd backend
if ! golangci-lint run --config .golangci.yml; then
    echo "❌ Linting failed. Please fix issues before committing."
    exit 1
fi

echo "✅ Linting passed!"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

**Alternative: Using pre-commit framework**

1. Install [pre-commit](https://pre-commit.com/):
   ```bash
   pip install pre-commit
   ```

2. Create `.pre-commit-config.yaml` in project root:
   ```yaml
   repos:
     - repo: https://github.com/golangci/golangci-lint
       rev: v1.59.1  # Update to latest version
       hooks:
         - id: golangci-lint
           args: ['--config=backend/.golangci.yml']
           pass_filenames: false
   ```

3. Install the hook:
   ```bash
   pre-commit install
   ```

### Docker Integration

Add linting stage to `Dockerfile`:

```dockerfile
# Lint stage
FROM golangci/golangci-lint:latest AS linter
WORKDIR /app
COPY go.mod go.sum ./
COPY . .
RUN golangci-lint run --config .golangci.yml

# Build stage
FROM golang:1.24.0-alpine AS builder
# ... rest of build
```

### Makefile Integration

Create or update `Makefile`:

```makefile
.PHONY: lint lint-fix

lint:
	@echo "Running golangci-lint..."
	@golangci-lint run --config .golangci.yml

lint-fix:
	@echo "Running golangci-lint with auto-fix..."
	@golangci-lint run --config .golangci.yml --fix
```

---

## Linter Details

### Alignment with CODING_STANDARDS.md

The configuration is specifically aligned with your [CODING_STANDARDS.md](./CODING_STANDARDS.md):

1. **Variable Naming:** `revive` linter enforces `var-naming` rules with common initialisms (ID, URL, HTTP, JSON, API, DB, SQL, SSE, OSRS, GE)

2. **Config Parameters:** Detects generic naming and suggests descriptive alternatives

3. **Package Organization:** `goimports` with local prefix ensures proper import grouping

4. **Function Naming:** `revive` enforces exported function comments and proper naming

5. **Struct Field Naming:** `govet` and `revive` catch improper field ordering and naming

### Test File Exemptions

Test files (`*_test.go`) are exempted from:
- `gocyclo` - Complexity checks (tests can be complex)
- `dupl` - Duplication checks (setup code often duplicates)
- `gosec` - Security checks (less critical in tests)
- `goconst` - Constant extraction (test data can repeat)
- `lll` - Line length (test tables can be long)

### Handler File Considerations

Handler files have relaxed `gocognit` (cognitive complexity) rules since HTTP handlers often contain branching logic.

---

## Suppressing False Positives

### Using nolint Comments

**Suppress specific linter on specific line:**
```go
//nolint:errcheck // Explanation: Logger sync errors are non-critical
defer logger.Sync()
```

**Suppress multiple linters:**
```go
//nolint:gosec,errcheck // G304: File path is validated earlier
content, err := os.ReadFile(filePath)
```

**Suppress for entire function:**
```go
//nolint:gocyclo // This function is complex by design
func complexBusinessLogic() {
    // ...
}
```

**Suppress for entire file:**
```go
//nolint:lll
package migrations
```

### Configuration Exclusions

For project-wide exclusions, update `.golangci.yml`:

```yaml
issues:
  exclude-rules:
    # Example: Exclude specific pattern
    - linters:
        - revive
      text: "specific error message"
      path: "internal/specific/path/.*\\.go"
```

### Best Practices for nolint

1. **Always provide explanation:** Required by `nolintlint`
2. **Be specific:** Use specific linter names, not blanket `nolint`
3. **Minimize scope:** Apply to single line when possible
4. **Review regularly:** Periodically audit nolint comments

---

## Troubleshooting

### Common Issues

**Issue: "too many open files"**
- Solution: Increase file descriptor limit or reduce `concurrency` in config

**Issue: "timeout exceeded"**
- Solution: Increase `timeout` in `.golangci.yml` or use `--timeout` flag

**Issue: "out of memory"**
- Solution: Reduce `concurrency` or run on specific directories

**Issue: Linter conflicts with formatter**
- Solution: Ensure `gofmt` and `goimports` settings match in IDE

### Performance Tips

1. **Use `--fast` flag** during development (skips some slow linters)
2. **Run on specific packages** during development: `golangci-lint run ./internal/handlers/...`
3. **Enable caching** (enabled by default in golangci-lint v1.42+)
4. **Use `--new` flag** to only check changed files

---

## Resources

- **Official Docs:** https://golangci-lint.run/
- **Linters List:** https://golangci-lint.run/usage/linters/
- **Configuration Reference:** https://golangci-lint.run/usage/configuration/
- **GitHub Repository:** https://github.com/golangci/golangci-lint

---

## Recommended Workflow

1. **During Development:**
   ```bash
   # Quick check (fast mode, only changed files)
   golangci-lint run --fast --new
   ```

2. **Before Committing:**
   ```bash
   # Full check with auto-fix
   ./lint.ps1 -Fix  # or ./lint.sh --fix
   ```

3. **In CI/CD:**
   ```bash
   # Full check, no auto-fix, generate reports
   golangci-lint run --out-format=checkstyle > lint-report.xml
   ```

4. **Weekly/Monthly:**
   ```bash
   # Full codebase audit
   golangci-lint run --enable-all --max-issues-per-linter=0
   ```
