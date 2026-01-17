# golangci-lint Quick Reference

## Installation

```bash
# Using Go
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Using Scoop (Windows)
scoop install golangci-lint

# Using Homebrew (macOS)
brew install golangci-lint
```

## Basic Commands

```bash
# Run all configured linters
golangci-lint run

# Run with auto-fix
golangci-lint run --fix

# Fast mode (skip slow linters)
golangci-lint run --fast

# Only new issues (since last commit)
golangci-lint run --new

# Specific directory
golangci-lint run ./internal/handlers/...

# Verbose output
golangci-lint run --verbose

# Different output formats
golangci-lint run --out-format=json
golangci-lint run --out-format=checkstyle
golangci-lint run --out-format=sarif
```

## Using Scripts

### Windows (PowerShell)
```powershell
.\lint.ps1              # Run all linters
.\lint.ps1 -Fix         # Run with auto-fix
.\lint.ps1 -Verbose     # Verbose output
```

### Unix (Linux/macOS)
```bash
./lint.sh               # Run all linters
./lint.sh --fix         # Run with auto-fix
./lint.sh --verbose     # Verbose output
```

## Suppressing Issues

### Single line
```go
//nolint:errcheck // Logger sync errors are non-critical
defer logger.Sync()
```

### Multiple linters
```go
//nolint:gosec,errcheck // G304: Path validated; error handled by caller
content, err := os.ReadFile(filePath)
```

### Entire function
```go
//nolint:gocyclo // Complex by design - handles 15 different message types
func processMessage(msg Message) error {
    // ...
}
```

### Entire file
```go
//nolint:lll
package migrations
```

## Enabled Linters (Quick List)

### Essential (Bugs & Correctness)
- `errcheck` - Unchecked errors
- `gosimple` - Code simplification
- `govet` - Suspicious constructs
- `ineffassign` - Ineffectual assignments
- `staticcheck` - Static analysis
- `typecheck` - Type checking
- `unused` - Unused code

### Style & Quality
- `revive` - Configurable linter
- `gofmt` - Code formatting
- `goimports` - Import formatting
- `misspell` - Spell checking
- `godot` - Comment punctuation
- `whitespace` - Whitespace detection

### Complexity
- `gocyclo` - Cyclomatic complexity (limit: 15)
- `gocognit` - Cognitive complexity (limit: 20)

### Performance
- `bodyclose` - HTTP response closure
- `noctx` - Context in HTTP requests
- `prealloc` - Slice preallocation

### Security
- `gosec` - Security vulnerabilities

### Best Practices
- `gocritic` - Various diagnostics
- `nolintlint` - Proper nolint directives
- `exportloopref` - Loop variable refs
- `goconst` - Repeated strings
- `errorlint` - Error misuses

## Configuration Limits

| Setting | Value |
|---------|-------|
| Line length | 120 characters |
| Cyclomatic complexity | 15 |
| Cognitive complexity | 20 |
| Function results | 3 max |
| Function arguments | 5 max |
| Timeout | 5 minutes |

## Common Initialisms (Must be uppercase)

```
ID, URL, HTTP, JSON, API, DB, SQL, SSE, OSRS, GE
```

### Examples
- ✅ `userID`, `httpClient`, `apiKey`
- ❌ `userId`, `HttpClient`, `ApiKey`

## Import Organization

```go
import (
    // 1. Standard library
    "context"
    "fmt"
    
    // 2. External packages
    "github.com/gofiber/fiber/v2"
    "go.uber.org/zap"
    
    // 3. Project packages
    "github.com/guavi/osrs-ge-tracker/internal/models"
)
```

## Test File Exemptions

Test files (`*_test.go`) skip:
- `gocyclo` - Complexity
- `dupl` - Duplication
- `gosec` - Security
- `goconst` - Constants
- `lll` - Line length

## Common Fixes

### Unchecked errors
```go
// ❌ BAD
result, _ := doSomething()

// ✅ GOOD
result, err := doSomething()
if err != nil {
    return err
}

// ✅ GOOD (intentional ignore)
//nolint:errcheck // Error intentionally ignored - non-critical operation
result, _ := doSomething()
```

### HTTP body closure
```go
// ❌ BAD
resp, err := http.Get(url)

// ✅ GOOD
resp, err := http.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close()
```

### Context in HTTP requests
```go
// ❌ BAD
resp, err := http.Get(url)

// ✅ GOOD
req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
if err != nil {
    return err
}
resp, err := client.Do(req)
```

### Slice preallocation
```go
// ❌ BAD
var items []Item
for _, raw := range rawItems {
    items = append(items, processItem(raw))
}

// ✅ GOOD
items := make([]Item, 0, len(rawItems))
for _, raw := range rawItems {
    items = append(items, processItem(raw))
}
```

## Workflows

### Development Loop
```bash
# 1. Write code
# 2. Quick check
golangci-lint run --fast --new

# 3. Auto-fix simple issues
golangci-lint run --fix

# 4. Commit
git commit -m "feat: add new feature"
```

### Pre-Commit (Automated)
```bash
# Install once
pip install pre-commit
pre-commit install

# Now automatic on every commit
git commit -m "fix: correct error handling"
```

### Full Check (Before PR)
```bash
# Run all linters
golangci-lint run

# Run tests
go test ./...

# Check coverage
go test ./... -cover
```

## Troubleshooting

### "too many open files"
```bash
# Increase limit or reduce concurrency
golangci-lint run --concurrency 2
```

### "timeout exceeded"
```bash
# Increase timeout
golangci-lint run --timeout 10m
```

### "out of memory"
```bash
# Reduce concurrency
golangci-lint run --concurrency 1
```

## IDE Integration

### VS Code
Settings already configured in `.vscode/settings.json`:
- Auto-format on save
- Auto-organize imports
- Real-time linting
- Hover diagnostics

**Just reload window!**

### GoLand
1. Settings → Tools → Go Linter
2. Select `golangci-lint`
3. Config: `backend/.golangci.yml`
4. Enable "Run on save"

## CI/CD

GitHub Actions workflow already configured in `.github/workflows/lint.yml`:
- Runs on push to main/develop
- Runs on pull requests
- Only checks backend changes
- Uploads SARIF to Security tab

## Resources

- **Docs:** https://golangci-lint.run/
- **Linters:** https://golangci-lint.run/usage/linters/
- **Config:** https://golangci-lint.run/usage/configuration/
- **Full Guide:** See [LINTING.md](./LINTING.md)
- **Proposal:** See [LINTING_PROPOSAL.md](./LINTING_PROPOSAL.md)

---

**Quick Help:**
```bash
golangci-lint help
golangci-lint linters    # List all available linters
golangci-lint run --help # Command help
```
